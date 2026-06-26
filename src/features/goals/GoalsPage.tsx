import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Target, Pencil, Trash2, Lightbulb, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { GoalForm } from './GoalForm'
import { useGoals, useDashboardData } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import { formatDate } from '../../utils/date'
import { deleteGoal } from '../../database/queries'
import type { Goal } from '../../types'
import { calcSavingPlan, formatMonths, type SavingPlan } from '../../utils/goals'

// ─── Saving hint shown inside each goal card ─────────────────────────────────
function SavingHint({ plan }: { plan: SavingPlan }) {
  if (!plan.feasible && plan.hasDeadline) {
    return (
      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-status-warning/8">
        <AlertTriangle size={13} className="text-status-warning flex-shrink-0 mt-0.5" />
        <p className="text-xs text-text-secondary">
          Precisaria de{' '}
          <span className="font-semibold text-text-primary">{formatCurrency(plan.monthlyAmount)}/mês</span>{' '}
          para cumprir o prazo, mas seu disponível é menor. Considere ampliar o prazo.
        </p>
      </div>
    )
  }

  const accent = plan.pctOfFree > 50 ? 'text-status-warning' : 'text-accent-500'

  return (
    <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-accent-500/6">
      <Lightbulb size={13} className={`${accent} flex-shrink-0 mt-0.5`} />
      <p className="text-xs text-text-secondary">
        Guarde{' '}
        <span className="font-semibold text-text-primary">{formatCurrency(plan.monthlyAmount)}/mês</span>
        {plan.pctOfFree > 0 && (
          <span className="text-text-muted"> ({plan.pctOfFree}% do disponível)</span>
        )}{' '}
        e chegue lá em{' '}
        <span className="font-semibold text-text-primary">{formatMonths(plan.monthsToReach)}</span>.
      </p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function GoalsPage() {
  const goals = useGoals()
  const { remaining } = useDashboardData()

  const [addOpen, setAddOpen]         = useState(false)
  const [editTarget, setEditTarget]   = useState<Goal | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)

  const totalTarget  = goals.reduce((s, g) => s + g.targetAmount,  0)
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0)
  const monthlyFree  = Math.max(0, remaining)

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader
        title="Metas"
        subtitle={`${goals.length} meta${goals.length !== 1 ? 's' : ''} ativa${goals.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Nova meta
          </Button>
        }
      />

      {/* Summary */}
      {goals.length > 0 && (
        <Card className="mb-5">
          <p className="text-xs text-text-muted mb-1">Progresso geral</p>
          <p className="text-2xl font-bold text-text-primary mb-3">
            {formatCurrency(totalCurrent)}
            <span className="text-sm font-normal text-text-muted ml-1.5">de {formatCurrency(totalTarget)}</span>
          </p>
          <ProgressBar value={totalCurrent} max={totalTarget} />
          {monthlyFree > 0 && (
            <p className="text-xs text-text-muted mt-2">
              Disponível este mês: <span className="font-medium text-status-success">{formatCurrency(monthlyFree)}</span>
            </p>
          )}
        </Card>
      )}

      {/* Goals list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {goals.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <EmptyState
                  icon={<Target size={20} />}
                  title="Nenhuma meta ainda"
                  description="Defina seus objetivos financeiros e acompanhe o progresso."
                  action={
                    <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                      Criar primeira meta
                    </Button>
                  }
                />
              </Card>
            </motion.div>
          ) : (
            goals.map(goal => {
              const pct        = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
              const isComplete = pct >= 100
              const plan       = !isComplete ? calcSavingPlan(goal, monthlyFree) : null

              return (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <Card>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: goal.color }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-text-primary truncate">{goal.name}</p>
                          {goal.description && (
                            <p className="text-xs text-text-muted mt-0.5">{goal.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <button
                          onClick={() => setEditTarget(goal)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(goal)}
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:bg-status-danger/8 hover:text-status-danger transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="flex justify-between items-end mb-2">
                      <div>
                        <p className="text-xl font-bold text-text-primary">{formatCurrency(goal.currentAmount)}</p>
                        <p className="text-xs text-text-muted">de {formatCurrency(goal.targetAmount)}</p>
                      </div>
                      <p className="text-2xl font-bold" style={{ color: isComplete ? '#10B981' : goal.color }}>
                        {Math.round(pct)}%
                      </p>
                    </div>

                    <ProgressBar value={goal.currentAmount} max={goal.targetAmount} color={goal.color} />

                    {goal.deadline && (
                      <p className="text-xs text-text-muted mt-2">Prazo: {formatDate(goal.deadline)}</p>
                    )}

                    {/* Completed */}
                    {isComplete && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-status-success font-medium">
                        <CheckCircle2 size={13} />
                        Meta atingida! Parabéns.
                      </div>
                    )}

                    {/* Monthly saving hint */}
                    {!isComplete && plan && <SavingHint plan={plan} />}

                    {/* No free money warning */}
                    {!isComplete && !plan && monthlyFree <= 0 && (
                      <div className="mt-3 flex items-start gap-2 p-2.5 rounded-xl bg-surface-100">
                        <p className="text-xs text-text-muted">
                          Libere dinheiro no orçamento para ver quanto guardar por mês.
                        </p>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova meta" description="Defina seu objetivo financeiro.">
        <GoalForm onClose={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar meta">
        {editTarget && <GoalForm goal={editTarget} onClose={() => setEditTarget(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteGoal(deleteTarget!.id!); setDeleteTarget(null) }}
        title="Excluir meta"
        description={`Excluir "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
