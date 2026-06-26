import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database/db'
import { getDate, getMonth, getYear } from '../utils/date'

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

export function useIncomes(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? getMonth(now) + 1
  const y = year ?? getYear(now)
  return useLiveQuery(() => db.incomes.where({ month: m, year: y }).toArray(), [m, y]) ?? []
}

export function useDashboardData() {
  const profile = useProfile()
  const bills = useBills()
  const investments = useInvestments()
  const goals = useGoals()

  const now = new Date()
  const currentDay = getDate(now)
  const currentMonth = getMonth(now) + 1
  const currentYear = getYear(now)

  const incomeEntries = useIncomes(currentMonth, currentYear)

  const baseSalary = profile?.monthlyIncome ?? 0
  const extraIncome = incomeEntries.reduce((s, e) => s + e.amount, 0)
  const totalIncome = baseSalary + extraIncome

  const pendingBills = bills.filter(b => b.status !== 'paid')
  const paidBills = bills.filter(b => b.status === 'paid')

  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0)
  const totalPaid = paidBills.reduce((s, b) => s + b.amount, 0)
  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)
  const remaining = totalIncome - totalExpenses - totalInvested

  const dueSoon = pendingBills
    .filter(b => { const diff = b.dueDay - currentDay; return diff >= 0 && diff <= 7 })
    .sort((a, b) => a.dueDay - b.dueDay)

  const overdue = pendingBills.filter(b => b.dueDay < currentDay)
  const installments = bills.filter(b => b.isInstallment)

  return {
    profile,
    bills,
    investments,
    goals,
    incomeEntries,
    baseSalary,
    extraIncome,
    totalIncome,
    totalExpenses,
    totalPaid,
    remaining,
    dueSoon,
    overdue,
    installments,
    totalInvested,
  }
}
