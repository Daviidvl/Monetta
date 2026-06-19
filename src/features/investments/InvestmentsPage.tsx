import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, Pencil, Trash2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { InvestmentForm } from './InvestmentForm'
import { useInvestments } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import { INVESTMENT_TYPE_LABELS } from '../../types'
import { deleteInvestment } from '../../database/queries'
import type { Investment } from '../../types'
import { formatDate } from '../../utils/date'

const typeColors: Record<string, string> = {
  savings:     '#10B981',
  treasury:    '#3B82F6',
  cdb:         '#8B5CF6',
  stocks:      '#F59E0B',
  crypto:      '#EF4444',
  real_estate: '#14B8A6',
  other:       '#94A3B8',
}

export function InvestmentsPage() {
  const investments = useInvestments()
  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Investment | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null)

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    for (const inv of investments) {
      map[inv.type] = (map[inv.type] ?? 0) + inv.amount
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [investments])

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader
        title="Investimentos"
        subtitle={`${investments.length} ativo${investments.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Adicionar
          </Button>
        }
      />

      {/* Total */}
      <Card className="mb-5 bg-gradient-to-br from-surface-0 to-surface-50">
        <p className="text-xs text-text-muted mb-1">Total investido</p>
        <p className="text-3xl font-bold text-text-primary tracking-tight">
          {formatCurrency(totalInvested)}
        </p>
        {investments.length > 0 && (
          <p className="text-xs text-text-muted mt-1.5">
            em {investments.length} investimento{investments.length !== 1 ? 's' : ''}
          </p>
        )}
      </Card>

      {/* Distribution by type */}
      {byType.length > 1 && (
        <Card className="mb-5">
          <p className="text-xs font-medium text-text-secondary mb-3">Distribuição</p>
          <div className="space-y-2.5">
            {byType.map(([type, amount]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[type] }} />
                    <span className="text-xs text-text-secondary">
                      {INVESTMENT_TYPE_LABELS[type as keyof typeof INVESTMENT_TYPE_LABELS]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-text-primary">{formatCurrency(amount)}</span>
                    <span className="text-xs text-text-muted ml-1.5">
                      {Math.round((amount / totalInvested) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-surface-200 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: typeColors[type] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(amount / totalInvested) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Investment list */}
      <Card padded={false}>
        <AnimatePresence mode="popLayout">
          {investments.length === 0 ? (
            <EmptyState
              key="empty"
              icon={<TrendingUp size={20} />}
              title="Nenhum investimento ainda"
              description="Registre seus investimentos para acompanhar seu patrimônio."
              action={
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                  Adicionar investimento
                </Button>
              }
            />
          ) : (
            investments.map(inv => (
              <motion.div
                key={inv.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle last:border-0"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${typeColors[inv.type]}18` }}
                >
                  <TrendingUp size={16} style={{ color: typeColors[inv.type] }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary truncate">{inv.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-text-muted">
                      {INVESTMENT_TYPE_LABELS[inv.type]}
                    </span>
                    {inv.platform && (
                      <>
                        <span className="text-text-muted">·</span>
                        <span className="text-xs text-text-muted">{inv.platform}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{formatCurrency(inv.amount)}</p>
                    <p className="text-xs text-text-muted">{formatDate(inv.date)}</p>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setEditTarget(inv)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(inv)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-status-danger/8 hover:text-status-danger transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </Card>

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Novo investimento">
        <InvestmentForm onClose={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar investimento">
        {editTarget && <InvestmentForm investment={editTarget} onClose={() => setEditTarget(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteInvestment(deleteTarget!.id!); setDeleteTarget(null) }}
        title="Excluir investimento"
        description={`Excluir "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
