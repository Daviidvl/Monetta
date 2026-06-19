import { useState, useRef } from 'react'
import { Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Button } from '../../components/ui/Button'
import { exportAllData, importAllData } from '../../database/queries'

interface BackupModalProps {
  open: boolean
  onClose: () => void
}

export function BackupModal({ open, onClose }: BackupModalProps) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [importMessage, setImportMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleExport() {
    setExporting(true)
    try {
      const data = await exportAllData()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
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
      if (!data.bills || !data.goals || !data.investments) {
        throw new Error('Arquivo inválido')
      }
      await importAllData(data)
      setImportStatus('success')
      setImportMessage('Dados importados com sucesso!')
    } catch (err) {
      setImportStatus('error')
      setImportMessage('Erro ao importar. Verifique se o arquivo é válido.')
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Backup" description="Exporte ou importe seus dados financeiros.">
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
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        {/* Status */}
        {importStatus !== 'idle' && (
          <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${
            importStatus === 'success'
              ? 'bg-status-success/8 text-status-success'
              : 'bg-status-danger/8 text-status-danger'
          }`}>
            {importStatus === 'success'
              ? <CheckCircle2 size={15} />
              : <AlertCircle size={15} />
            }
            {importMessage}
          </div>
        )}

        <div className="pt-2">
          <p className="text-xs text-text-muted">
            Todos os dados são armazenados localmente no seu dispositivo. O backup permite transferir dados entre dispositivos ou navegadores.
          </p>
        </div>
      </div>
    </Modal>
  )
}
