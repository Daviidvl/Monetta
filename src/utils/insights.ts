import type { Bill, Goal, Investment, UserProfile } from '../types'
import { formatCurrency } from './format'

export interface Insight {
  id: string
  text: string
  type: 'info' | 'warning' | 'success' | 'neutral'
}

export function generateInsights(
  profile: UserProfile | undefined,
  bills: Bill[],
  investments: Investment[],
  goals: Goal[],
): Insight[] {
  const insights: Insight[] = []
  if (!profile) return insights

  const income = profile.monthlyIncome
  const pendingBills = bills.filter(b => b.status !== 'paid')
  const totalExpenses = pendingBills.reduce((s, b) => s + b.amount, 0)
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0)
  const remaining = income - totalExpenses - totalPaid
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

  // Maior conta
  const highestBill = pendingBills.sort((a, b) => b.amount - a.amount)[0]
  if (highestBill && income > 0) {
    const pct = Math.round((highestBill.amount / income) * 100)
    insights.push({
      id: 'highest-bill',
      text: `${highestBill.name} representa ${pct}% da sua renda.`,
      type: pct > 30 ? 'warning' : 'neutral',
    })
  }

  // Parcelas
  const installments = bills.filter(b => b.isInstallment)
  if (installments.length > 0) {
    const finishing = installments.filter(b => {
      const remaining = (b.installmentTotal ?? 0) - (b.installmentPaid ?? 0)
      return remaining <= 3 && remaining > 0
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
  }

  // Investimentos vs renda
  if (totalInvested > 0 && income > 0) {
    insights.push({
      id: 'invested',
      text: `Você tem ${formatCurrency(totalInvested)} investidos no total.`,
      type: 'success',
    })
  }

  // Meta principal
  const mainGoal = goals[0]
  if (mainGoal) {
    const pct = Math.round((mainGoal.currentAmount / mainGoal.targetAmount) * 100)
    if (pct >= 100) {
      insights.push({
        id: 'goal-reached',
        text: `Meta "${mainGoal.name}" atingida! Parabéns.`,
        type: 'success',
      })
    } else {
      insights.push({
        id: 'goal-progress',
        text: `Meta "${mainGoal.name}" está ${pct}% concluída.`,
        type: 'info',
      })
    }
  }

  // Despesas vs renda
  if (income > 0 && totalExpenses > 0) {
    const pct = Math.round((totalExpenses / income) * 100)
    if (pct > 80) {
      insights.push({
        id: 'expense-ratio',
        text: `Suas despesas comprometem ${pct}% da sua renda este mês.`,
        type: 'warning',
      })
    }
  }

  return insights.slice(0, 4)
}
