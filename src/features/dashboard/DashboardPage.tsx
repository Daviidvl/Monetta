import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, Moon, Sun, Plus, Pencil, Trash2, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { BudgetRing } from '../../components/ui/BudgetRing'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { IncomeForm } from '../income/IncomeForm'
import { useDashboardData } from '../../hooks/useData'
import { formatCurrency, parseNumber } from '../../utils/format'
import { dueDayLabel } from '../../utils/date'
import { generateInsights, getDailyTip } from '../../utils/insights'
import { useAppStore } from '../../store/useAppStore'
import { PRIORITY_LABELS, INCOME_CATEGORY_LABELS, type IncomeEntry } from '../../types'
import { deleteIncome, updateMonthlyIncome } from '../../database/queries'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

export function DashboardPage() {
  const data = useDashboardData()
  const {
    profile, bills, investments, goals,
    incomeEntries, baseSalary, extraIncome, totalIncome,
    totalExpenses, remaining,
    dueSoon, overdue, installments, totalInvested,
  } = data

  const { theme, toggleTheme } = useAppStore()

  // Fix: pass totalIncome so insights use salary + extras
  const insights = generateInsights(profile, bills, investments, goals, totalIncome)
  const tip = getDailyTip()

  const [incomeOpen, setIncomeOpen] = useState(false)
  const [editIncome, setEditIncome] = useState<IncomeEntry | null>(null)
  const [deleteIncomeTarget, setDeleteIncomeTarget] = useState<IncomeEntry | null>(null)
  const [editSalaryOpen, setEditSalaryOpen] = useState(false)
  const [salaryInput, setSalaryInput] = useState('')
  const [savingSalary, setSavingSalary] = useState(false)

  const pctExpenses = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
  const mainGoal = goals[0]

  async function handleSaveSalary() {
    const val = parseNumber(salaryInput)
    if (!val || val <= 0) return
    setSavingSalary(true)
    await updateMonthlyIncome(val)
    setSavingSalary(false)
    setEditSalaryOpen(false)
  }

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">

        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted mb-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              {profile ? `Olá, ${profile.name.split(' ')[0]}` : 'Dashboard'}
            </h1>
          </div>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </motion.div>

        {/* Main balance card */}
        <motion.div variants={fadeUp}>
          <Card className="bg-accent-500 border-0 shadow-lg shadow-accent-500/25 p-5">
            <p className="text-xs text-white/70 mb-1">Saldo previsto do mês</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(remaining)}
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-white/70 flex-wrap">
              <span>Receita: {formatCurrency(totalIncome)}</span>
              <span>·</span>
              <span>Despesas: {formatCurrency(totalExpenses)}</span>
              {totalInvested > 0 && (
                <>
                  <span>·</span>
                  <span>Investido: {formatCurrency(totalInvested)}</span>
                </>
              )}
            </div>
            {totalIncome > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-white/70 mb-1.5">
                  <span>Comprometido</span>
                  <span>{Math.round(pctExpenses)}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/20 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, pctExpenses)}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Budget ring chart */}
        {(totalExpenses > 0 || totalInvested > 0) && totalIncome > 0 && (
          <motion.div variants={fadeUp}>
            <Card className="flex flex-col items-center py-5">
              <p className="text-xs text-text-muted mb-4">Visão geral do orçamento</p>
              <BudgetRing income={totalIncome} expenses={totalExpenses} invested={totalInvested} />
              <div className="mt-4 grid grid-cols-3 gap-3 w-full">
                <div className="text-center">
                  <p className="text-[10px] text-text-muted">Receita</p>
                  <p className="text-xs font-semibold text-text-primary">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="text-center border-x border-border-subtle">
                  <p className="text-[10px] text-text-muted">Despesas</p>
                  <p className="text-xs font-semibold text-status-danger">{formatCurrency(totalExpenses)}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-text-muted">Livre</p>
                  <p className="text-xs font-semibold text-status-success">
                    {formatCurrency(Math.max(0, remaining))}
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ─── Entradas (income) card ─── */}
        <motion.div variants={fadeUp}>
          <Card padded={false}>
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <div>
                <CardTitle>Entradas do mês</CardTitle>
                <p className="text-lg font-semibold text-text-primary mt-0.5">
                  {formatCurrency(totalIncome)}
                </p>
              </div>
              <button
                onClick={() => setIncomeOpen(true)}
                className="w-8 h-8 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-500 hover:bg-accent-500/20 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Salary row — editable */}
            <div className="border-t border-border-subtle">
              <div className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-status-success/12 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-status-success">$</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary">Salário base</p>
                  {profile?.paymentDay && (
                    <p className="text-xs text-text-muted">Todo dia {profile.paymentDay}</p>
                  )}
                </div>
                <p className="text-sm font-semibold text-text-primary flex-shrink-0">
                  {formatCurrency(baseSalary)}
                </p>
                <button
                  onClick={() => { setSalaryInput(String(baseSalary)); setEditSalaryOpen(true) }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors flex-shrink-0"
                >
                  <Pencil size={11} />
                </button>
              </div>

              {/* Extra income entries */}
              {incomeEntries.map(entry => (
                <div key={entry.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-border-subtle">
                  <div className="w-7 h-7 rounded-lg bg-accent-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-accent-500">+</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary truncate">{entry.name}</p>
                    <p className="text-xs text-text-muted">{INCOME_CATEGORY_LABELS[entry.category]}</p>
                  </div>
                  <p className="text-sm font-semibold text-status-success flex-shrink-0">
                    +{formatCurrency(entry.amount)}
                  </p>
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => setEditIncome(entry)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => setDeleteIncomeTarget(entry)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-status-danger/8 hover:text-status-danger transition-colors"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}

              {extraIncome > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle bg-surface-50 rounded-b-2xl">
                  <p className="text-xs font-semibold text-text-secondary">Total</p>
                  <p className="text-sm font-bold text-status-success">{formatCurrency(totalIncome)}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Overdue alert */}
        {overdue.length > 0 && (
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-status-danger/8 border border-status-danger/20">
              <AlertCircle size={16} className="text-status-danger flex-shrink-0" />
              <p className="text-sm text-status-danger font-medium flex-1">
                {overdue.length} conta{overdue.length > 1 ? 's' : ''} em atraso
              </p>
              <Link to="/contas" className="text-xs text-status-danger font-medium">
                Ver <ChevronRight size={12} className="inline" />
              </Link>
            </div>
          </motion.div>
        )}

        {/* Due soon */}
        {dueSoon.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <CardHeader className="px-4 pt-4">
                <CardTitle>Vencendo em breve</CardTitle>
                <Link to="/contas" className="text-xs text-accent-500 font-medium">Ver tudo</Link>
              </CardHeader>
              <div className="divide-y divide-border-subtle">
                {dueSoon.slice(0, 4).map(bill => (
                  <div key={bill.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{bill.name}</p>
                      <p className="text-xs text-text-muted">{dueDayLabel(bill.dueDay)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-text-primary">{formatCurrency(bill.amount)}</p>
                      <Badge
                        variant={bill.priority === 'high' ? 'danger' : bill.priority === 'medium' ? 'warning' : 'muted'}
                        className="text-[10px]"
                      >
                        {PRIORITY_LABELS[bill.priority]}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Installments */}
        {installments.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <CardHeader className="px-4 pt-4">
                <CardTitle>Parcelamentos</CardTitle>
                <Link to="/contas?tab=installments" className="text-xs text-accent-500 font-medium">Ver tudo</Link>
              </CardHeader>
              <div className="px-4 pb-4 space-y-4">
                {installments.slice(0, 3).map(bill => {
                  const total = bill.installmentTotal ?? 1
                  const paid = bill.installmentPaid ?? 0
                  const rem = total - paid
                  return (
                    <div key={bill.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-sm font-medium text-text-primary">{bill.name}</p>
                        <p className="text-xs text-text-muted">{paid}/{total}</p>
                      </div>
                      <ProgressBar value={paid} max={total} size="sm" />
                      <p className="text-xs text-text-muted mt-1">
                        {rem} restante{rem !== 1 ? 's' : ''} · {formatCurrency(bill.amount)}/mês
                      </p>
                    </div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Main Goal */}
        {mainGoal && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle>Meta principal</CardTitle>
                  <Link to="/metas" className="text-xs text-accent-500 font-medium">Ver metas</Link>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mainGoal.color }} />
                    <p className="text-sm font-medium text-text-primary">{mainGoal.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    {Math.round((mainGoal.currentAmount / mainGoal.targetAmount) * 100)}%
                  </p>
                </div>
                <ProgressBar value={mainGoal.currentAmount} max={mainGoal.targetAmount} color={mainGoal.color} />
                <div className="flex justify-between mt-2 text-xs text-text-muted">
                  <span>{formatCurrency(mainGoal.currentAmount)}</span>
                  <span>{formatCurrency(mainGoal.targetAmount)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Insights + tip */}
        <motion.div variants={fadeUp}>
          <Card padded={false}>
            <div className="px-4 pt-4 pb-2">
              <CardTitle className="mb-3">Insights</CardTitle>
              {insights.length > 0 ? insights.map((insight, i) => (
                <div
                  key={insight.id}
                  className={`py-2.5 text-sm text-text-secondary flex items-start gap-2 ${
                    i < insights.length - 1 ? 'border-b border-border-subtle' : ''
                  }`}
                >
                  <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    insight.type === 'success' ? 'bg-status-success' :
                    insight.type === 'warning' ? 'bg-status-warning' :
                    insight.type === 'info'    ? 'bg-accent-500'     : 'bg-text-muted'
                  }`} />
                  {insight.text}
                </div>
              )) : (
                <p className="text-sm text-text-muted py-2">Adicione contas e receitas para ver seus insights.</p>
              )}
            </div>

            {/* Daily tip */}
            <div className="mx-4 mb-4 mt-2 flex items-start gap-2.5 p-3 rounded-xl bg-accent-500/8">
              <Lightbulb size={14} className="text-accent-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-text-secondary leading-relaxed">{tip.text}</p>
            </div>
          </Card>
        </motion.div>

        {/* Empty state */}
        {bills.length === 0 && investments.length === 0 && goals.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card>
              <EmptyState
                title="Tudo pronto para começar"
                description="Adicione suas contas, investimentos e metas para visualizar seus dados aqui."
                action={
                  <Link to="/contas" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-500">
                    Adicionar primeira conta <ChevronRight size={14} />
                  </Link>
                }
              />
            </Card>
          </motion.div>
        )}
      </motion.div>

      {/* Modals */}
      <Modal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        title="Adicionar entrada"
        description="Registre uma receita extra deste mês."
      >
        <IncomeForm onClose={() => setIncomeOpen(false)} />
      </Modal>

      <Modal open={!!editIncome} onClose={() => setEditIncome(null)} title="Editar entrada">
        {editIncome && <IncomeForm income={editIncome} onClose={() => setEditIncome(null)} />}
      </Modal>

      <Modal
        open={editSalaryOpen}
        onClose={() => setEditSalaryOpen(false)}
        title="Editar salário base"
        description="Como sua renda é variável, ajuste o valor sempre que necessário."
      >
        <div className="space-y-4 pt-1">
          <Input
            label="Salário base este mês"
            prefix="R$"
            type="number"
            inputMode="decimal"
            value={salaryInput}
            onChange={e => setSalaryInput(e.target.value)}
            placeholder="0,00"
          />
          <Button
            className="w-full"
            onClick={handleSaveSalary}
            loading={savingSalary}
          >
            Salvar
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteIncomeTarget}
        onClose={() => setDeleteIncomeTarget(null)}
        onConfirm={async () => { await deleteIncome(deleteIncomeTarget!.id!); setDeleteIncomeTarget(null) }}
        title="Excluir entrada"
        description={`Excluir "${deleteIncomeTarget?.name}"?`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
