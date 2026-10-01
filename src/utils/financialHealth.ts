import type { Bill, Goal, Investment } from '../types'
import { INVESTMENT_TYPE_LABELS } from '../types'
import { formatCurrency } from './format'

export type HealthLevel = 'critical' | 'warning' | 'good' | 'excellent'

export interface HealthMetric {
  id: 'savings' | 'expenses' | 'diversification' | 'debt' | 'goals'
  label: string
  score: number
  valueLabel: string
  tip: string
  status: HealthLevel
  /** Missão do mês cumprida — cada card de métrica É a missão correspondente. */
  done: boolean
}

export interface HealthReport {
  score: number
  level: HealthLevel
  summary: string
  metrics: HealthMetric[]
}

export const LEVEL_LABELS: Record<HealthLevel, string> = {
  critical:  'Crítica',
  warning:   'Atenção',
  good:      'Boa',
  excellent: 'Excelente',
}

export const LEVEL_COLORS: Record<HealthLevel, string> = {
  critical:  '#FF5B6A',
  warning:   '#FFA534',
  good:      '#7A2FFF',
  excellent: '#46D889',
}

const WEIGHTS = { savings: 30, expenses: 25, diversification: 20, debt: 15, goals: 10 }

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value))
}

function levelForScore(score: number): HealthLevel {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 35) return 'warning'
  return 'critical'
}

interface HealthInput {
  totalIncome: number
  /** Bills cycle total (fixed commitments), not including ad-hoc debit expenses. */
  totalExpenses: number
  /** Investimentos/aportes em metas que saíram da conta este mês. */
  totalSavedThisMonth: number
  investments: Investment[]
  /** Parcelamentos/financiamentos ainda em aberto. */
  installments: Bill[]
  goals: Goal[]
  /** Aportes em metas feitos neste mês — usado pela missão de "Progresso em metas". */
  goalDepositsThisMonth: number
}

export function calculateHealthScore({
  totalIncome, totalExpenses, totalSavedThisMonth, investments, installments, goals, goalDepositsThisMonth,
}: HealthInput): HealthReport {
  // ── Taxa de poupança ──────────────────────────────────────────
  const savingsRate  = totalIncome > 0 ? totalSavedThisMonth / totalIncome : 0
  const savingsScore = Math.round(clamp((savingsRate / 0.20) * 100))
  const savingsPct   = Math.round(savingsRate * 100)
  const savingsDone  = totalIncome > 0 && savingsRate >= 0.20
  const savingsTip   = totalIncome === 0
    ? 'Cadastre sua renda para acompanhar esta missão.'
    : savingsDone
      ? `Missão cumprida — você guarda ${savingsPct}% da renda este mês (meta: 20%).`
      : `Faltam ${formatCurrency(Math.max(0, totalIncome * 0.20 - totalSavedThisMonth))} para bater os 20% (hoje: ${savingsPct}%).`

  // ── Comprometimento com contas fixas ──────────────────────────
  const expenseRatio = totalIncome > 0 ? totalExpenses / totalIncome : 0
  const expenseScore = Math.round(expenseRatio <= 0.5 ? 100 : clamp(100 - (expenseRatio - 0.5) * 200))
  const expensePct   = Math.round(expenseRatio * 100)
  const expenseDone  = totalIncome > 0 && expenseRatio <= 0.5
  const expenseTip   = totalIncome === 0
    ? 'Cadastre suas contas e renda para acompanhar esta missão.'
    : expenseDone
      ? `Missão cumprida — suas contas fixas comprometem ${expensePct}% da renda (até 50%).`
      : `Suas contas fixas comprometem ${expensePct}% da renda — acima do ideal (50%). Reveja contratos e assinaturas.`

  // ── Diversificação de investimentos ───────────────────────────
  const byType = new Map<string, number>()
  investments.forEach(inv => byType.set(inv.type, (byType.get(inv.type) ?? 0) + inv.amount))
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)
  const topType       = [...byType.entries()].sort((a, b) => b[1] - a[1])[0]
  const concentration = totalInvested > 0 && topType ? topType[1] / totalInvested : 1
  const diversificationScore = totalInvested === 0
    ? 0
    : Math.round(clamp((1 - concentration) * 100 + (byType.size > 1 ? 10 : 0)))
  const diversificationDone = byType.size >= 2
  const diversificationTip = totalInvested === 0
    ? 'Comece a investir este mês, nem que seja um valor pequeno — a reserva de emergência é um bom ponto de partida.'
    : diversificationDone
      ? `Missão cumprida — carteira diversificada em ${byType.size} tipos de investimento.`
      : `Toda sua carteira está em ${INVESTMENT_TYPE_LABELS[topType![0] as keyof typeof INVESTMENT_TYPE_LABELS]}. Adicione um novo tipo para diversificar.`

  // ── Parcelamentos/financiamentos em aberto ────────────────────
  const monthlyInstallments = installments.reduce((s, b) => s + b.amount, 0)
  const debtRatio = totalIncome > 0 ? monthlyInstallments / totalIncome : 0
  const debtScore = Math.round(debtRatio <= 0 ? 100 : clamp(100 - (debtRatio / 0.3) * 100))
  const debtPct   = Math.round(debtRatio * 100)
  const debtDone  = monthlyInstallments === 0 || debtRatio <= 0.20
  const debtTip   = monthlyInstallments === 0
    ? 'Você não tem parcelamentos em aberto.'
    : debtDone
      ? `Missão cumprida — parcelamentos comprometem ${debtPct}% da renda (até 20%).`
      : `Parcelamentos comprometem ${debtPct}% da renda. Priorize quitar os de maior juros até ficar abaixo de 20%.`

  // ── Progresso em metas ─────────────────────────────────────────
  const avgGoalProgress = goals.length > 0
    ? goals.reduce((s, g) => s + clamp(g.targetAmount > 0 ? g.currentAmount / g.targetAmount : 0, 0, 1), 0) / goals.length
    : 0
  const goalsScore = goals.length === 0 ? 0 : Math.round(avgGoalProgress * 100)
  const goalsDone  = goals.length > 0 && goalDepositsThisMonth > 0
  const goalsTip    = goals.length === 0
    ? 'Crie uma meta para direcionar suas economias.'
    : goalsDone
      ? `Missão cumprida — você já guardou ${formatCurrency(goalDepositsThisMonth)} para suas metas este mês.`
      : 'Guarde um valor, mesmo pequeno, em alguma meta este mês.'

  const metrics: HealthMetric[] = [
    { id: 'savings',         label: 'Taxa de poupança',       score: savingsScore,         valueLabel: `${savingsPct}%`, tip: savingsTip,         status: levelForScore(savingsScore),         done: savingsDone },
    { id: 'expenses',        label: 'Contas fixas vs. renda', score: expenseScore,         valueLabel: `${expensePct}%`, tip: expenseTip,         status: levelForScore(expenseScore),         done: expenseDone },
    { id: 'diversification', label: 'Diversificação',         score: diversificationScore, valueLabel: totalInvested > 0 ? `${byType.size} tipo${byType.size > 1 ? 's' : ''}` : '—', tip: diversificationTip, status: levelForScore(diversificationScore), done: diversificationDone },
    { id: 'debt',            label: 'Parcelamentos',          score: debtScore,            valueLabel: `${debtPct}%`,    tip: debtTip,            status: levelForScore(debtScore),            done: debtDone },
    { id: 'goals',           label: 'Progresso em metas',     score: goalsScore,           valueLabel: goals.length > 0 ? `${goalsScore}%` : '—', tip: goalsTip,           status: levelForScore(goalsScore),           done: goalsDone },
  ]

  const score = Math.round(
    (savingsScore * WEIGHTS.savings
      + expenseScore * WEIGHTS.expenses
      + diversificationScore * WEIGHTS.diversification
      + debtScore * WEIGHTS.debt
      + goalsScore * WEIGHTS.goals) / 100,
  )
  const level = levelForScore(score)

  const worst = [...metrics].sort((a, b) => a.score - b.score)[0]
  const baseSummary: Record<HealthLevel, string> = {
    excellent: 'Sua saúde financeira está excelente. Continue assim.',
    good:      'Sua saúde financeira está boa. Alguns ajustes podem destravar mais resultado.',
    warning:   'Sua saúde financeira pede atenção.',
    critical:  'Sua saúde financeira está em alerta.',
  }
  const summary = level === 'excellent'
    ? baseSummary.excellent
    : `${baseSummary[level]} Ponto de atenção: ${worst.label.toLowerCase()}.`

  return { score, level, summary, metrics }
}

export interface InvestmentTip {
  id: string
  text: string
}

/** Dicas de investimento calculadas em cima da carteira real do usuário, não genéricas. */
export function getInvestmentTips(investments: Investment[], savingsRate: number): InvestmentTip[] {
  const tips: InvestmentTip[] = []
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)
  const byType = new Map<string, number>()
  investments.forEach(inv => byType.set(inv.type, (byType.get(inv.type) ?? 0) + inv.amount))

  if (totalInvested === 0) {
    tips.push({
      id: 'start',
      text: 'Comece pela reserva de emergência: 6 meses das suas despesas em algo líquido, como Tesouro Selic ou CDB com liquidez diária.',
    })
  } else {
    const hasLiquidReserve = byType.has('savings') || byType.has('treasury') || byType.has('cdb')
    if (!hasLiquidReserve) {
      tips.push({
        id: 'liquidity',
        text: 'Você não tem reserva líquida (poupança, Tesouro ou CDB). Mantenha uma parte resgatável rápido para emergências antes de investir no resto.',
      })
    }

    if (byType.size === 1) {
      const [onlyType] = byType.keys()
      tips.push({
        id: 'diversify',
        text: `Toda sua carteira está em ${INVESTMENT_TYPE_LABELS[onlyType as keyof typeof INVESTMENT_TYPE_LABELS]}. Diversificar entre renda fixa e variável reduz o risco sem abrir mão de retorno.`,
      })
    }

    const cryptoAmount = byType.get('crypto') ?? 0
    if (cryptoAmount > 0 && cryptoAmount / totalInvested > 0.3) {
      tips.push({
        id: 'crypto-risk',
        text: `${Math.round((cryptoAmount / totalInvested) * 100)}% da sua carteira está em criptomoedas — um ativo de alta volatilidade. Considere reequilibrar para reduzir o risco.`,
      })
    }
  }

  if (savingsRate < 0.10) {
    tips.push({
      id: 'automate',
      text: 'Automatize uma transferência para investimentos no dia do pagamento. "Pague-se primeiro" evita que a sobra do mês vire gasto por impulso.',
    })
  }

  return tips.slice(0, 4)
}
