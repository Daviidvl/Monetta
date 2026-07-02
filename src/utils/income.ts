import type { IncomeFrequency } from '../types'

// Multiplier to normalize an amount received per `IncomeFrequency` period
// into a monthly total. "Quinzenal" in pt-BR means paid twice a month
// (e.g. dias 15 e 30), so it's exactly ×2 — not a 26-payments/year cycle.
const FREQUENCY_MULTIPLIER: Record<IncomeFrequency, number> = {
  daily: 22,       // ~22 working days/month
  weekly: 52 / 12,  // ~4.33 weeks/month
  biweekly: 2,
  monthly: 1,
}

export function toMonthlyIncome(amount: number, frequency: IncomeFrequency): number {
  return amount * FREQUENCY_MULTIPLIER[frequency]
}
