import { motion } from 'framer-motion'
import { AlertCircle, ChevronRight, Moon, Sun } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { EmptyState } from '../../components/ui/EmptyState'
import { useDashboardData } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import { dueDayLabel } from '../../utils/date'
import { generateInsights } from '../../utils/insights'
import { useAppStore } from '../../store/useAppStore'
import { PRIORITY_LABELS } from '../../types'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <p className="text-xs text-text-muted mb-1">{label}</p>
        <p className="text-xl font-semibold text-text-primary tracking-tight">{value}</p>
        {sub && (
          <p className={`text-xs mt-0.5 ${
            trend === 'up' ? 'text-status-success' :
            trend === 'down' ? 'text-status-danger' :
            'text-text-muted'
          }`}>
            {sub}
          </p>
        )}
      </Card>
    </motion.div>
  )
}

export function DashboardPage() {
  const {
    profile,
    bills,
    investments,
    goals,
    income,
    totalExpenses,
    totalPaid,
    remaining,
    dueSoon,
    overdue,
    installments,
    totalInvested,
  } = useDashboardData()

  const { theme, toggleTheme } = useAppStore()
  const insights = generateInsights(profile, bills, investments, goals)

  const pctExpenses = income > 0 ? (totalExpenses / income) * 100 : 0

  const mainGoal = goals[0]

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      {/* Header */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="space-y-5"
      >
        <motion.div variants={fadeUp} className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted mb-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              {profile ? `Olá, ${profile.name.split(' ')[0]}` : 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
            >
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </motion.div>

        {/* Main balance card */}
        <motion.div variants={fadeUp}>
          <Card className="bg-accent-500 border-0 shadow-lg shadow-accent-500/25 p-5">
            <p className="text-xs text-white/70 mb-1">Saldo previsto do mês</p>
            <p className="text-3xl font-bold text-white tracking-tight">
              {formatCurrency(remaining)}
            </p>
            <div className="mt-3 flex items-center gap-4 text-xs text-white/70">
              <span>Renda: {formatCurrency(income)}</span>
              <span>·</span>
              <span>Despesas: {formatCurrency(totalExpenses)}</span>
            </div>
            {income > 0 && (
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

        {/* Stats grid */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
          <StatCard
            label="Receita mensal"
            value={formatCurrency(income)}
            sub={profile ? `Dia ${profile.paymentDay}` : undefined}
            trend="neutral"
          />
          <StatCard
            label="Total de despesas"
            value={formatCurrency(totalExpenses)}
            sub={`${bills.length} conta${bills.length !== 1 ? 's' : ''}`}
            trend={pctExpenses > 80 ? 'down' : 'neutral'}
          />
          <StatCard
            label="Já pago"
            value={formatCurrency(totalPaid)}
            sub={`${bills.filter(b => b.status === 'paid').length} contas`}
            trend="up"
          />
          <StatCard
            label="Investimentos"
            value={formatCurrency(totalInvested)}
            sub={`${investments.length} ativo${investments.length !== 1 ? 's' : ''}`}
            trend="up"
          />
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
                <Link to="/contas" className="text-xs text-accent-500 font-medium">
                  Ver tudo
                </Link>
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
                <Link to="/contas?tab=installments" className="text-xs text-accent-500 font-medium">
                  Ver tudo
                </Link>
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
                        <p className="text-xs text-text-muted">{paid}/{total} parcelas</p>
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
                  <Link to="/metas" className="text-xs text-accent-500 font-medium">
                    Todas as metas
                  </Link>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: mainGoal.color }}
                    />
                    <p className="text-sm font-medium text-text-primary">{mainGoal.name}</p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary">
                    {Math.round((mainGoal.currentAmount / mainGoal.targetAmount) * 100)}%
                  </p>
                </div>
                <ProgressBar
                  value={mainGoal.currentAmount}
                  max={mainGoal.targetAmount}
                  color={mainGoal.color}
                />
                <div className="flex justify-between mt-2 text-xs text-text-muted">
                  <span>{formatCurrency(mainGoal.currentAmount)}</span>
                  <span>{formatCurrency(mainGoal.targetAmount)}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <div className="px-4 pt-4 pb-2">
                <CardTitle className="mb-3">Insights</CardTitle>
                <div className="space-y-0">
                  {insights.map((insight, i) => (
                    <div
                      key={insight.id}
                      className={`py-2.5 text-sm text-text-secondary flex items-start gap-2 ${
                        i < insights.length - 1 ? 'border-b border-border-subtle' : ''
                      }`}
                    >
                      <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        insight.type === 'success' ? 'bg-status-success' :
                        insight.type === 'warning' ? 'bg-status-warning' :
                        insight.type === 'info' ? 'bg-accent-500' :
                        'bg-text-muted'
                      }`} />
                      {insight.text}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Empty state when no data */}
        {bills.length === 0 && investments.length === 0 && goals.length === 0 && (
          <motion.div variants={fadeUp}>
            <Card>
              <EmptyState
                title="Tudo pronto para começar"
                description="Adicione suas contas, investimentos e metas para visualizar seus dados aqui."
                action={
                  <Link
                    to="/contas"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-500"
                  >
                    Adicionar primeira conta <ChevronRight size={14} />
                  </Link>
                }
              />
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
