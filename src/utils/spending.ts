import type { Bill, BillCategory } from '../types'
import { CATEGORY_LABELS } from '../types'
import { getBillCycleTotals } from './bills'

export interface CategorySpend {
  category: BillCategory
  label: string
  amount: number
  pctOfIncome: number
}

/** Agrupa as contas do ciclo atual (pendentes + já pagas) por categoria, para mostrar "para onde vai o dinheiro". */
export function getCategoryBreakdown(bills: Bill[], month: number, year: number, totalIncome: number): CategorySpend[] {
  const { pendingBills, paidBills } = getBillCycleTotals(bills, month, year)
  const byCategory = new Map<BillCategory, number>()

  for (const bill of [...pendingBills, ...paidBills]) {
    byCategory.set(bill.category, (byCategory.get(bill.category) ?? 0) + bill.amount)
  }

  return [...byCategory.entries()]
    .map(([category, amount]) => ({
      category,
      label: CATEGORY_LABELS[category],
      amount,
      pctOfIncome: totalIncome > 0 ? Math.round((amount / totalIncome) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
}
