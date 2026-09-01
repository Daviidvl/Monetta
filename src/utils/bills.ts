import type { Bill } from '../types'
import { isBillScheduled } from './date'

// A finished installment plan (e.g. 10/10) has nothing left to track — it's
// done and shouldn't count as an active obligation in any cycle again.
export function isFinishedInstallment(bill: Bill): boolean {
  return bill.isInstallment && (bill.installmentPaid ?? 0) >= (bill.installmentTotal ?? 1)
}

export interface BillCycleTotals {
  pendingBills: Bill[]
  totalPending: number
  totalPaid: number
  totalExpenses: number
}

// Single source of truth for "how much is owed vs. already paid this cycle" —
// used by both the dashboard's "Contas" figure and the Contas page's "A
// pagar" / "Já pago este mês" cards, so the two can never drift apart again.
//
// A bill only belongs to the given cycle once its first due day has arrived
// (see isBillScheduled), and a paid bill only counts toward "Já pago" if it
// was actually paid in that same cycle — a one-time bill (or a finished
// installment plan) paid in an earlier month stays status 'paid' forever
// without being reset, but it shouldn't keep inflating later months' totals.
export function getBillCycleTotals(bills: Bill[], cycleMonth: number, cycleYear: number): BillCycleTotals {
  const cycleBills = bills
    .filter(b => !isFinishedInstallment(b))
    .filter(b => !isBillScheduled(b.createdAt, b.dueDay, cycleMonth, cycleYear))

  const pendingBills = cycleBills.filter(b => b.status !== 'paid')
  const paidBills = bills.filter(b => b.status === 'paid' && b.paidMonth === cycleMonth && b.paidYear === cycleYear)

  const totalPending = pendingBills.reduce((s, b) => s + b.amount, 0)
  const totalPaid = paidBills.reduce((s, b) => s + b.amount, 0)

  return { pendingBills, totalPending, totalPaid, totalExpenses: totalPending + totalPaid }
}
