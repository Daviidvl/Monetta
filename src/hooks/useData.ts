import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database/db'
import { getMonth, getYear, daysUntilDue } from '../utils/date'
import { useAppStore } from '../store/useAppStore'

export function useProfile() {
  return useLiveQuery(() => db.userProfile.orderBy('id').first())
}

export function useBills() {
  return useLiveQuery(() => db.bills.orderBy('dueDay').toArray()) ?? []
}

export function useInvestments() {
  return useLiveQuery(() => db.investments.orderBy('date').reverse().toArray()) ?? []
}

export function useGoals() {
  return useLiveQuery(() => db.goals.toArray()) ?? []
}

export function useWithdrawals() {
  return useLiveQuery(() => db.withdrawals.orderBy('date').reverse().toArray()) ?? []
}

export function useIncomes(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? getMonth(now) + 1
  const y = year ?? getYear(now)
  return useLiveQuery(() => db.incomes.where({ month: m, year: y }).toArray(), [m, y]) ?? []
}

export function useMonthlyDebitExpenses(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? getMonth(now) + 1
  const y = year ?? getYear(now)
  return useLiveQuery(async () => {
    const all = await db.debitExpenses.toArray()
    return all
      .filter(e => {
        const d = new Date(e.date)
        return d.getFullYear() === y && d.getMonth() + 1 === m
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [m, y]) ?? []
}

export function useDashboardData() {
  const profile    = useProfile()
  const bills      = useBills()
  const investments = useInvestments()
  const goals      = useGoals()

  const now          = new Date()
  const currentMonth = getMonth(now) + 1
  const currentYear  = getYear(now)
  const { activeMonth, activeYear } = useAppStore()

  const incomeEntries = useIncomes(currentMonth, currentYear)
  const debitExpenses = useMonthlyDebitExpenses(currentMonth, currentYear)

  const baseSalary  = profile?.monthlyIncome ?? 0
  const extraIncome = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const totalIncome = baseSalary + extraIncome

  const pendingBills = bills.filter(b => b.status !== 'paid')
  const paidBills    = bills.filter(b => b.status === 'paid')

  const totalExpenses      = bills.reduce((s, b) => s + b.amount, 0)
  const totalPaid          = paidBills.reduce((s, b) => s + b.amount, 0)
  const totalInvested      = investments.reduce((s, i) => s + i.amount, 0)
  const totalDebitExpenses = debitExpenses.reduce((s, e) => s + e.amount, 0)
  // Money moved into investments isn't a monthly expense — it only affects
  // "remaining" when it comes back out via a withdrawal (counted as income then).
  const remaining          = totalIncome - totalExpenses - totalDebitExpenses

  const dueSoon = pendingBills
    .filter(b => { const diff = daysUntilDue(b.dueDay, activeMonth, activeYear); return diff >= 0 && diff <= 7 })
    .sort((a, b) => a.dueDay - b.dueDay)

  const overdue      = pendingBills.filter(b => daysUntilDue(b.dueDay, activeMonth, activeYear) < 0)
  const installments = bills.filter(b => b.isInstallment)

  return {
    profile, bills, investments, goals,
    incomeEntries, debitExpenses,
    baseSalary, extraIncome, totalIncome,
    totalExpenses, totalPaid, totalInvested, totalDebitExpenses,
    remaining, dueSoon, overdue, installments,
  }
}
