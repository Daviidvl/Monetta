import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { PiggyBank, Receipt, PieChart, CreditCard, Target, Lightbulb, TrendingUp, CheckCircle2, type LucideIcon } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { Card, CardTitle } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { useDashboardData } from '../../hooks/useData'
import { useAppStore } from '../../store/useAppStore'
import { calculateHealthScore, getInvestmentTips, LEVEL_LABELS, LEVEL_COLORS, type HealthMetric } from '../../utils/financialHealth'
import { generateInsights, getDailyTip } from '../../utils/insights'
import { getCategoryBreakdown } from '../../utils/spending'
import { GoalSimulator } from './GoalSimulator'
import { WealthProjection } from './WealthProjection'
import { SpendingBreakdown } from './SpendingBreakdown'

const METRIC_ICONS: Record<HealthMetric['id'], LucideIcon> = {
  savings: PiggyBank,
  expenses: Receipt,
  diversification: PieChart,
  debt: CreditCard,
  goals: Target,
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
}

function ScoreRing({ score, level }: { score: number; level: keyof typeof LEVEL_COLORS }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const arc = (pct / 100) * circ
  const color = LEVEL_COLORS[level]

  return (
    <div className="relative">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-200)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circ}`}
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${arc} ${circ}` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-text-primary font-heading">{pct}</span>
        <span className="text-[10px] text-text-muted">/ 100</span>
      </div>
    </div>
  )
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const Icon  = METRIC_ICONS[metric.id]
  const color = LEVEL_COLORS[metric.status]

  return (
    <Card padded={false}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${color}1A`, color }}
            >
              <Icon size={16} />
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-medium truncate ${metric.done ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                {metric.label}
              </p>
              <p className="text-xs text-text-muted">{metric.valueLabel}</p>
            </div>
          </div>
          {metric.done ? (
            <CheckCircle2 size={18} className="text-status-success flex-shrink-0" />
          ) : (
            <span className="text-sm font-semibold flex-shrink-0" style={{ color }}>{metric.score}</span>
          )}
        </div>
        <ProgressBar value={metric.score} max={100} color={color} size="sm" />
        <p className="text-xs text-text-secondary mt-3">{metric.tip}</p>
      </div>
    </Card>
  )
}

export function HealthPage() {
  const {
    profile, bills, investments, goals, totalIncome, totalExpenses,
    totalSavedThisMonth, totalInvested, installments, remaining, totalGoalDepositsThisMonth,
  } = useDashboardData()
  const { activeMonth, activeYear } = useAppStore()

  const report   = calculateHealthScore({
    totalIncome, totalExpenses, totalSavedThisMonth, investments, installments, goals,
    goalDepositsThisMonth: totalGoalDepositsThisMonth,
  })
  const dailyTip = getDailyTip()
  const missionsDone = report.metrics.filter(m => m.done).length

  const savingsRate      = totalIncome > 0 ? totalSavedThisMonth / totalIncome : 0
  const investmentTips   = useMemo(() => getInvestmentTips(investments, savingsRate), [investments, savingsRate])
  const allInsights      = useMemo(
    () => generateInsights(profile, bills, investments, goals, totalIncome, activeMonth, activeYear, 20),
    [profile, bills, investments, goals, totalIncome, activeMonth, activeYear],
  )
  const spendingByCategory = useMemo(
    () => getCategoryBreakdown(bills, activeMonth, activeYear, totalIncome),
    [bills, activeMonth, activeYear, totalIncome],
  )
  const wealthBaseline = totalInvested + goals.reduce((s, g) => s + g.currentAmount, 0)

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
        <motion.div variants={fadeUp}>
          <PageHeader title="Saúde financeira" subtitle="Como estão suas finanças este mês" />
        </motion.div>

        <motion.div variants={fadeUp}>
          <Card className="flex flex-col items-center py-6">
            <ScoreRing score={report.score} level={report.level} />
            <p className="mt-3 text-sm font-semibold" style={{ color: LEVEL_COLORS[report.level] }}>
              {LEVEL_LABELS[report.level]}
            </p>
            <p className="mt-1 text-sm text-text-secondary text-center max-w-xs">{report.summary}</p>
          </Card>
        </motion.div>

        {/* Missões do mês — os próprios cards de métrica são as missões */}
        <motion.div variants={fadeUp} className="flex items-center justify-between px-1">
          <p className="text-xs font-medium text-text-muted">Missões do mês</p>
          <span className="text-xs font-semibold text-accent-500">{missionsDone}/{report.metrics.length}</span>
        </motion.div>
        <motion.div variants={fadeUp} className="space-y-3">
          {report.metrics.map(metric => <MetricCard key={metric.id} metric={metric} />)}
        </motion.div>

        {/* Simulador */}
        <motion.div variants={fadeUp}>
          <GoalSimulator available={remaining} />
        </motion.div>

        {/* Projeção de patrimônio */}
        <motion.div variants={fadeUp}>
          <WealthProjection baseline={wealthBaseline} monthlyRate={totalSavedThisMonth} />
        </motion.div>

        {/* Para onde vai o dinheiro */}
        {spendingByCategory.length > 0 && (
          <motion.div variants={fadeUp}>
            <SpendingBreakdown items={spendingByCategory} />
          </motion.div>
        )}

        {/* Dicas de investimento personalizadas */}
        {investmentTips.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-accent-500" />
                  <CardTitle>Dicas de investimento para você</CardTitle>
                </div>
                <div className="space-y-2.5">
                  {investmentTips.map(tip => (
                    <p key={tip.id} className="text-sm text-text-secondary flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent-500 flex-shrink-0" />
                      {tip.text}
                    </p>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Todos os insights */}
        {allInsights.length > 0 && (
          <motion.div variants={fadeUp}>
            <Card padded={false}>
              <div className="px-4 pt-4 pb-4">
                <CardTitle className="mb-3">Insights</CardTitle>
                {allInsights.map((insight, i) => (
                  <div
                    key={insight.id}
                    className={`py-2.5 text-sm text-text-secondary flex items-start gap-2 ${
                      i < allInsights.length - 1 ? 'border-b border-border-subtle' : ''
                    }`}
                  >
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                      insight.type === 'success' ? 'bg-status-success' :
                      insight.type === 'warning' ? 'bg-status-warning' :
                      insight.type === 'info'    ? 'bg-accent-500'     : 'bg-text-muted'
                    }`} />
                    {insight.text}
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        <motion.div variants={fadeUp}>
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-accent-500/6 border border-accent-500/15">
            <Lightbulb size={16} className="text-accent-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-text-secondary">{dailyTip.text}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
