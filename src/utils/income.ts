import type { IncomeFrequency } from '../types'

export interface IncomeInput {
  frequency: IncomeFrequency
  /** Primary amount — meaning depends on frequency (see IncomeInput usages). */
  amount: number
  /** 'biweekly' only — 2nd payment of the month, if different from the 1st. */
  amountSecondary?: number
  /** 'daily' only — days actually worked per month. */
  workDays?: number
}

const DEFAULT_WORK_DAYS = 22
const WEEKS_PER_MONTH = 52 / 12

// Normalizes any income pattern into a single monthly total, used everywhere
// else in the app. "Quinzenal" in pt-BR means paid twice a month (e.g. dias
// 15 e 30) and those two payments often differ, so they're summed directly
// rather than assuming amount × 2.
export function toMonthlyIncome(input: IncomeInput): number {
  switch (input.frequency) {
    case 'daily':
      return input.amount * (input.workDays && input.workDays > 0 ? input.workDays : DEFAULT_WORK_DAYS)
    case 'weekly':
      return input.amount * WEEKS_PER_MONTH
    case 'biweekly':
      return input.amount + (input.amountSecondary ?? input.amount)
    case 'variable':
    case 'monthly':
    default:
      return input.amount
  }
}
