import type { Goal } from '../types'

export interface SavingPlan {
  monthlyAmount: number
  monthsToReach: number
  feasible: boolean
  hasDeadline: boolean
  pctOfFree: number
}

export function calcSavingPlan(goal: Goal, monthlyFree: number): SavingPlan | null {
  const toReach = goal.targetAmount - goal.currentAmount
  if (toReach <= 0) return null
  if (monthlyFree <= 0) return null

  const now = new Date()

  if (goal.deadline) {
    const deadline = new Date(goal.deadline)
    const monthsLeft = Math.max(1,
      (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
    )
    const needed = Math.ceil(toReach / monthsLeft)
    return {
      monthlyAmount: needed,
      monthsToReach: monthsLeft,
      feasible: needed <= monthlyFree,
      hasDeadline: true,
      pctOfFree: Math.round((needed / monthlyFree) * 100),
    }
  }

  // No deadline — suggest 20% of free
  const suggested = Math.max(1, Math.round(monthlyFree * 0.2))
  return {
    monthlyAmount: suggested,
    monthsToReach: Math.ceil(toReach / suggested),
    feasible: true,
    hasDeadline: false,
    pctOfFree: 20,
  }
}

export function formatMonths(n: number): string {
  if (n <= 1) return '1 mês'
  if (n < 12) return `${n} meses`
  const y = Math.floor(n / 12)
  const m = n % 12
  const yStr = y === 1 ? '1 ano' : `${y} anos`
  return m === 0 ? yStr : `${yStr} e ${m} ${m === 1 ? 'mês' : 'meses'}`
}
