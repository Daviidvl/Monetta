export type ExpenseCategory = 'food' | 'transport' | 'health' | 'shopping' | 'entertainment' | 'other'

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'food', 'transport', 'health', 'shopping', 'entertainment', 'other',
]

export interface ParsedExpense {
  amount: number
  description: string
  category: ExpenseCategory
  date: string // ISO date (yyyy-mm-dd)
}

export interface PendingExpenseRow {
  id: number
  amount: number
  description: string
  category: ExpenseCategory
  expense_date: string
  source: string
  raw_message: string | null
  created_at: string
}
