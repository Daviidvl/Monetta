import { useState } from 'react'
import { motion } from 'framer-motion'
import { CloudUpload } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { migrateLocalDataToCloud } from '../../services/dataMigration'

interface MigrationOfferPageProps {
  onDone: () => void
}

export function MigrationOfferPage({ onDone }: MigrationOfferPageProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUpload() {
    setLoading(true)
    setError('')
    try {
      await migrateLocalDataToCloud()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo deu errado ao enviar os dados.')
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-surface-0 px-6 py-12">
      <motion.div
        className="w-full max-w-md bg-surface-0 rounded-3xl shadow-card p-6 text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center mx-auto mb-5 shadow-glow">
          <CloudUpload size={22} className="text-white" />
        </div>

        <h1 className="text-lg font-semibold text-text-primary font-heading mb-2">
          Encontramos dados salvos neste navegador
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Contas, investimentos, metas e gastos salvos localmente antes do login. Quer enviar tudo para sua conta agora?
        </p>

        {error && <p className="text-xs text-status-danger mb-4">{error}</p>}

        <div className="flex flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth loading={loading} onClick={handleUpload}>
            Enviar para minha conta
          </Button>
          <Button variant="ghost" fullWidth disabled={loading} onClick={onDone}>
            Ignorar e continuar
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
