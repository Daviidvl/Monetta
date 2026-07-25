import { addDebitExpense, deleteDebitExpense } from '../database/queries'
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../types'
import { formatCurrency } from '../utils/format'
import { useToastStore } from '../store/useToastStore'

interface PendingExpenseDTO {
  id: number
  amount: number
  description: string
  category: ExpenseCategory
  expense_date: string
}

export async function reconcilePendingExpenses(): Promise<void> {
  const res = await fetch('/api/pending')
  if (!res.ok) return

  const { items } = (await res.json()) as { items: PendingExpenseDTO[] }
  if (items.length === 0) return

  const ackedIds: number[] = []

  for (const item of items) {
    const newId = await addDebitExpense({
      description: item.description,
      amount: item.amount,
      category: item.category,
      date: new Date(item.expense_date),
      createdAt: new Date(),
    })
    ackedIds.push(item.id)

    useToastStore.getState().push({
      message: `${formatCurrency(item.amount)} em ${EXPENSE_CATEGORY_LABELS[item.category]} registrado via WhatsApp`,
      onUndo: () => deleteDebitExpense(newId),
    })
  }

  await fetch('/api/pending/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: ackedIds }),
  })
}
