import type { Bill, Goal, Investment, UserProfile } from '../types'
import { formatCurrency } from './format'
import { getBillCycleTotals, isFinishedInstallment } from './bills'
import { getEmergencyReserve, remainingBalance, summarizeDebts, type FocusMode } from './focusMode'

export interface Insight {
  id: string
  text: string
  type: 'info' | 'warning' | 'success' | 'neutral' | 'tip'
}

const TIPS: Insight[] = [
  { id: 'tip-1', text: 'Regra 50/30/20: 50% necessidades, 30% desejos, 20% poupança.', type: 'tip' },
  { id: 'tip-2', text: 'Pague sempre as contas de alta prioridade nos primeiros dias do mês.', type: 'tip' },
  { id: 'tip-3', text: 'Reserva de emergência ideal: 6 meses das suas despesas mensais.', type: 'tip' },
  { id: 'tip-4', text: 'Invista antes de gastar — pague-se primeiro a cada recebimento.', type: 'tip' },
  { id: 'tip-5', text: 'Cancele assinaturas que você não usa há mais de 30 dias.', type: 'tip' },
  { id: 'tip-6', text: 'R$ 10 a menos por dia equivalem a R$ 3.600 economizados no ano.', type: 'tip' },
  { id: 'tip-7', text: 'Diversifique seus investimentos para reduzir riscos.', type: 'tip' },
  { id: 'tip-8', text: 'Renegocie dívidas e financiamentos periodicamente — os juros caem.', type: 'tip' },
]

export function getDailyTip(): Insight {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86_400_000
  )
  return TIPS[dayOfYear % TIPS.length]
}

export function generateInsights(
  profile: UserProfile | undefined,
  bills: Bill[],
  investments: Investment[],
  goals: Goal[],
  totalIncome: number,
  activeMonth: number,
  activeYear: number,
  limit = 4,
  mode: FocusMode = 'organize',
): Insight[] {
  const base = baseInsights(profile, bills, investments, goals, totalIncome, activeMonth, activeYear)
  if (!profile) return base

  if (mode === 'debt') {
    const debt = summarizeDebts(bills.filter(b => b.isInstallment && !isFinishedInstallment(b)))
    const extra: Insight[] = []
    if (debt.nextToClear) {
      extra.push({
        id: 'debt-next',
        text: `"${debt.nextToClear.name}" é a dívida mais perto de acabar — faltam ${formatCurrency(remainingBalance(debt.nextToClear))}. Ataque ela primeiro.`,
        type: 'info',
      })
    }
    if (debt.debts.length > 0) {
      extra.push({
        id: 'debt-no-new',
        text: 'Evite novas parcelas até quitar as atuais — cada uma nova adia sua data de liberdade.',
        type: 'tip',
      })
    }
    // Investment nudges are noise while the user is paying off debt.
    const filtered = base.filter(i => i.id !== 'invest-low' && i.id !== 'invested')
    return [...extra, ...filtered].slice(0, limit)
  }

  if (mode === 'invest') {
    const { totalExpenses } = getBillCycleTotals(bills, activeMonth, activeYear)
    const reserve = getEmergencyReserve(investments, totalExpenses)
    const extra: Insight[] = []
    if (reserve.target > 0) {
      const months = totalExpenses > 0 ? Math.floor(reserve.liquid / totalExpenses) : 0
      extra.push(reserve.done
        ? { id: 'reserve-done', text: 'Reserva de emergência completa. Você pode diversificar com mais segurança.', type: 'success' }
        : { id: 'reserve-progress', text: `Sua reserva cobre ${months} ${months === 1 ? 'mês' : 'meses'} de contas. O ideal são 6 — faltam ${formatCurrency(reserve.missing)}.`, type: 'info' })
    }
    const activeInstallments = bills.filter(b => b.isInstallment && !isFinishedInstallment(b))
    if (activeInstallments.length > 0) {
      extra.push({
        id: 'invest-debt-first',
        text: 'Você ainda tem parcelamentos ativos. Se tiverem juros altos, quitar rende mais que a maioria dos investimentos.',
        type: 'tip',
      })
    }
    return [...extra, ...base].slice(0, limit)
  }

  return base.slice(0, limit)
}

function baseInsights(
  profile: UserProfile | undefined,
  bills: Bill[],
  investments: Investment[],
  goals: Goal[],
  totalIncome: number,
  activeMonth: number,
  activeYear: number,
): Insight[] {
  const insights: Insight[] = []
  if (!profile) return insights

  const income = totalIncome
  const { pendingBills, totalExpenses } = getBillCycleTotals(bills, activeMonth, activeYear)
  const remaining = income - totalExpenses
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)

  // Saldo livre
  if (remaining > 0) {
    insights.push({
      id: 'remaining',
      text: `Você possui ${formatCurrency(remaining)} livres este mês.`,
      type: 'success',
    })
  } else if (remaining < 0) {
    insights.push({
      id: 'deficit',
      text: `Suas despesas ultrapassam sua renda em ${formatCurrency(Math.abs(remaining))}.`,
      type: 'warning',
    })
  }

  // Maior conta vs renda
  const highestBill = [...pendingBills].sort((a, b) => b.amount - a.amount)[0]
  if (highestBill && income > 0) {
    const pct = Math.round((highestBill.amount / income) * 100)
    insights.push({
      id: 'highest-bill',
      text: `${highestBill.name} representa ${pct}% da sua renda.`,
      type: pct > 30 ? 'warning' : 'neutral',
    })
  }

  // Parcelas finalizando
  const installments = bills.filter(b => b.isInstallment && !isFinishedInstallment(b))
  const finishing = installments.filter(b => {
    const rem = (b.installmentTotal ?? 0) - (b.installmentPaid ?? 0)
    return rem <= 3 && rem > 0
  })
  if (finishing.length > 0) {
    const b = finishing[0]
    const rem = (b.installmentTotal ?? 0) - (b.installmentPaid ?? 0)
    insights.push({
      id: 'installment-ending',
      text: `Restam ${rem} parcela${rem > 1 ? 's' : ''} de ${b.name}.`,
      type: 'info',
    })
  }

  // Investimentos
  if (totalInvested > 0 && income > 0) {
    const invPct = Math.round((totalInvested / income) * 100)
    if (invPct < 10) {
      insights.push({
        id: 'invest-low',
        text: `Você investe ${invPct}% da sua renda. O ideal é pelo menos 20%.`,
        type: 'warning',
      })
    } else {
      insights.push({
        id: 'invested',
        text: `Você tem ${formatCurrency(totalInvested)} investidos no total.`,
        type: 'success',
      })
    }
  }

  // Meta principal
  const mainGoal = goals[0]
  if (mainGoal) {
    const pct = Math.round((mainGoal.currentAmount / mainGoal.targetAmount) * 100)
    if (pct >= 100) {
      insights.push({ id: 'goal-reached', text: `Meta "${mainGoal.name}" atingida! Parabéns.`, type: 'success' })
    } else {
      insights.push({ id: 'goal-progress', text: `Meta "${mainGoal.name}" está ${pct}% concluída.`, type: 'info' })
    }
  }

  // Despesas vs renda
  if (income > 0 && totalExpenses > 0) {
    const pct = Math.round((totalExpenses / income) * 100)
    if (pct > 90) {
      insights.push({
        id: 'expense-ratio',
        text: `Suas despesas comprometem ${pct}% da sua renda — muito alto.`,
        type: 'warning',
      })
    }
  }

  return insights
}
