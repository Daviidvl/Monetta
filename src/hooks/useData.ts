import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../database/db'
import { getDate } from '../utils/date'

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

export function useDashboardData() {
  const profile = useProfile()
  const bills = useBills()
  const investments = useInvestments()
  const goals = useGoals()

  const today = new Date()
  const currentDay = getDate(today)

  const income = profile?.monthlyIncome ?? 0

  const pendingBills = bills.filter(b => b.status !== 'paid')
  const paidBills = bills.filter(b => b.status === 'paid')

  const totalExpenses = bills.reduce((s, b) => s + b.amount, 0)
  const totalPaid = paidBills.reduce((s, b) => s + b.amount, 0)
  const remaining = income - totalExpenses

  const dueSoon = pendingBills.filter(b => {
    const diff = b.dueDay - currentDay
    return diff >= 0 && diff <= 7
  }).sort((a, b) => a.dueDay - b.dueDay)

  const overdue = pendingBills.filter(b => b.dueDay < currentDay)

  const installments = bills.filter(b => b.isInstallment)

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0)

  return {
    profile,
    bills,
    investments,
    goals,
    income,
    totalExpenses,
    totalPaid,
    remaining,
    dueSoon,
    overdue,
    installments,
    totalInvested,
  }
}
