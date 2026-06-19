import type { Bill, Goal, Investment, UserProfile } from '../types'
import { formatCurrency } from './format'

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
): Insight[] {
  const insights: Insight[] = []
  if (!profile) return insights

  const income = totalIncome
  const pendingBills = bills.filter(b => b.status !== 'paid')
  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0)
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
  const installments = bills.filter(b => b.isInstallment)
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

  return insights.slice(0, 4)
}
