import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, CheckCircle2, Trash2, TriangleAlert } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { exportAllData, importAllData, clearAllData } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'

interface BackupModalProps {
  open: boolean
  onClose: () => void
}

export function BackupModal({ open, onClose }: BackupModalProps) {
  const [exporting, setExporting]       = useState(false)
  const [importing, setImporting]       = useState(false)
  const [clearing, setClearing]         = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { setHasOnboarded, setLastResetKey } = useAppStore()

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `monetta-backup-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportStatus('idle')
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      if (!data.bills || !data.goals || !data.investments) throw new Error('Arquivo inválido')
      await importAllData(data)
      setImportStatus('success')
      setImportMessage('Dados importados com sucesso!')
    } catch {
      setImportStatus('error')
      setImportMessage('Erro ao importar. Verifique se o arquivo é válido.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleClear() {
    setClearing(true)
    try {
      await clearAllData()
      // Reset app state so onboarding shows again
      setHasOnboarded(false)
      setLastResetKey('')
      onClose()
    } finally {
      setClearing(false)
      setConfirmClear(false)
    }
  }

  function handleClose() {
    setConfirmClear(false)
    setImportStatus('idle')
    onClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title="Dados" description="Gerencie seus dados financeiros.">
      <div className="space-y-3">

        {/* Export */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center flex-shrink-0">
            <Download size={18} className="text-status-success" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Exportar dados</p>
            <p className="text-xs text-text-muted">Salve um backup JSON com todos os seus dados.</p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting}>
            Exportar
          </Button>
        </div>

        {/* Import */}
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border-subtle">
          <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center flex-shrink-0">
            <Upload size={18} className="text-accent-500" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">Importar backup</p>
            <p className="text-xs text-text-muted">Restaure dados de um arquivo JSON exportado anteriormente.</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileRef.current?.click()}
            loading={importing}
          >
            Importar
          </Button>
          <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>

        {/* Import status */}
        {importStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            importStatus === 'success'
              ? 'bg-status-success/8 text-status-success'
              : 'bg-status-danger/8 text-status-danger'
          }`}>
            {importStatus === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {importMessage}
          </div>
        )}

        {/* Divider */}
        <div className="border-t border-border-subtle pt-1" />

        {/* Clear all data — two-step */}
        {!confirmClear ? (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border-subtle">
            <div className="w-10 h-10 rounded-xl bg-status-danger/10 flex items-center justify-center flex-shrink-0">
              <Trash2 size={18} className="text-status-danger" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">Limpar todos os dados</p>
              <p className="text-xs text-text-muted">Remove tudo e volta para o início. Irreversível.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              className="text-status-danger border-status-danger/30 hover:bg-status-danger/8"
              onClick={() => setConfirmClear(true)}
            >
              Limpar
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-2xl border-2 border-status-danger/40 bg-status-danger/5 space-y-3">
            <div className="flex items-start gap-3">
              <TriangleAlert size={18} className="text-status-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-text-primary">Tem certeza?</p>
                <p className="text-xs text-text-muted mt-0.5">
                  Todos os dados serão apagados permanentemente — contas, investimentos, metas, histórico.
                  Faça um backup antes se quiser guardar alguma coisa.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                fullWidth
                onClick={() => setConfirmClear(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                fullWidth
                className="bg-status-danger hover:bg-status-danger/90 text-white border-0"
                onClick={handleClear}
                loading={clearing}
              >
                Apagar tudo
              </Button>
            </div>
          </div>
        )}

        <p className="text-xs text-text-muted pt-1">
          Todos os dados ficam armazenados localmente no seu dispositivo.
        </p>
      </div>
    </Modal>
  )
}
