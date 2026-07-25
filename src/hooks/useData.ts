import { useQuery } from '@tanstack/react-query'
import {
  getProfile, getBills, getInvestments, getGoals,
  getWithdrawals, getIncomes, getMonthlyDebitExpenses,
} from '../database/queries'
import { queryKeys } from '../database/queryKeys'
import { getMonth, getYear, daysUntilDue } from '../utils/date'
import { useAppStore } from '../store/useAppStore'
import { useAuthStore } from '../store/useAuthStore'

export function useProfile() {
  const authenticated = useAuthStore(s => s.status === 'authenticated')
  const { data } = useQuery({ queryKey: queryKeys.profile, queryFn: getProfile, enabled: authenticated })
  return data
}

export function useBills() {
  const { data } = useQuery({ queryKey: queryKeys.bills, queryFn: getBills })
  return data ?? []
}

export function useInvestments() {
  const { data } = useQuery({ queryKey: queryKeys.investments, queryFn: getInvestments })
  return data ?? []
}

export function useGoals() {
  const { data } = useQuery({ queryKey: queryKeys.goals, queryFn: getGoals })
  return data ?? []
}

export function useWithdrawals() {
  const { data } = useQuery({ queryKey: queryKeys.withdrawals, queryFn: getWithdrawals })
  return data ?? []
}

export function useIncomes(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? getMonth(now) + 1
  const y = year ?? getYear(now)
  const { data } = useQuery({ queryKey: [...queryKeys.incomes, m, y], queryFn: () => getIncomes(m, y) })
  return data ?? []
}

export function useMonthlyDebitExpenses(month?: number, year?: number) {
  const now = new Date()
  const m = month ?? getMonth(now) + 1
  const y = year ?? getYear(now)
  const { data } = useQuery({ queryKey: [...queryKeys.debitExpenses, m, y], queryFn: () => getMonthlyDebitExpenses(m, y) })
  return data ?? []
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
