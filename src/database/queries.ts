import { supabase } from '../lib/supabaseClient'
import { queryClient } from '../lib/queryClient'
import { queryKeys } from './queryKeys'
import { toCamelCase, toSnakeCase } from './caseMap'
import { db } from './db'
import type { Bill, BillStatus, DebitExpense, Goal, IncomeEntry, Investment, PaymentRecord, UserProfile, Withdrawal } from '../types'

function invalidate(...keys: (readonly string[])[]) {
  for (const key of keys) queryClient.invalidateQueries({ queryKey: key })
}

async function getUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  return user.id
}

function throwIfError<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message)
  return data as T
}

// ─── Row mappers (snake_case + date strings -> camelCase + Date) ──────
function mapProfile(row: Record<string, unknown>): UserProfile {
  return {
    ...toCamelCase<UserProfile>(row),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapBill(row: Record<string, unknown>): Bill {
  return {
    ...toCamelCase<Bill>(row),
    paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapInvestment(row: Record<string, unknown>): Investment {
  return {
    ...toCamelCase<Investment>(row),
    date: new Date(row.date as string),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapWithdrawal(row: Record<string, unknown>): Withdrawal {
  return {
    ...toCamelCase<Withdrawal>(row),
    date: new Date(row.date as string),
    createdAt: new Date(row.created_at as string),
  }
}

function mapGoal(row: Record<string, unknown>): Goal {
  return {
    ...toCamelCase<Goal>(row),
    deadline: row.deadline ? new Date(row.deadline as string) : undefined,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapPaymentRecord(row: Record<string, unknown>): PaymentRecord {
  return {
    ...toCamelCase<PaymentRecord>(row),
    paidAt: new Date(row.paid_at as string),
  }
}

function mapIncome(row: Record<string, unknown>): IncomeEntry {
  return {
    ...toCamelCase<IncomeEntry>(row),
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function mapDebitExpense(row: Record<string, unknown>): DebitExpense {
  return {
    ...toCamelCase<DebitExpense>(row),
    date: new Date(row.date as string),
    createdAt: new Date(row.created_at as string),
  }
}

// ─── UserProfile ───────────────────────────────────────────
export async function getProfile(): Promise<UserProfile | undefined> {
  const userId = await getUserId()
  const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
  throwIfError({ data, error })
  return data ? mapProfile(data) : undefined
}

export async function saveProfile(profile: Omit<UserProfile, 'id'>): Promise<string> {
  const userId = await getUserId()
  const existing = await getProfile()

  if (existing?.id) {
    const { error } = await supabase
      .from('user_profiles')
      .update(toSnakeCase({ ...profile, updatedAt: new Date() }))
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
    invalidate(queryKeys.profile)
    return existing.id
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(toSnakeCase({ ...profile, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.profile)
  return row.id
}

export async function updateMonthlyIncome(amount: number): Promise<void> {
  const existing = await getProfile()
  if (!existing?.id) return
  const { error } = await supabase
    .from('user_profiles')
    .update({ monthly_income: amount, updated_at: new Date().toISOString() })
    .eq('id', existing.id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.profile)
}

// ─── Bills ─────────────────────────────────────────────────
export async function getBills(): Promise<Bill[]> {
  const { data, error } = await supabase.from('bills').select('*').order('due_day', { ascending: true })
  throwIfError({ data, error })
  return (data ?? []).map(mapBill)
}

export async function addBill(bill: Omit<Bill, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('bills')
    .insert(toSnakeCase({ ...bill, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.bills)
  return row.id
}

export async function updateBill(id: string, changes: Partial<Bill>): Promise<void> {
  const { error } = await supabase
    .from('bills')
    .update(toSnakeCase({ ...changes, updatedAt: new Date() }))
    .eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.bills)
}

export async function deleteBill(id: string): Promise<void> {
  // payment_records.bill_id is ON DELETE CASCADE — no manual cleanup needed.
  const { error } = await supabase.from('bills').delete().eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.bills, queryKeys.paymentRecords, queryKeys.billHistory)
}

// `cycleMonth`/`cycleYear` identify the billing cycle the user is currently
// working through (store's activeMonth/activeYear) — not necessarily the
// real wall-clock month, since a cycle can be closed out early.
export async function markBillPaid(id: string, cycleMonth: number, cycleYear: number): Promise<void> {
  const now = new Date()
  const { data: billRaw, error: getError } = await supabase.from('bills').select('*').eq('id', id).maybeSingle()
  if (getError) throw new Error(getError.message)
  if (!billRaw) return
  const bill = mapBill(billRaw)

  const updates: Record<string, unknown> = {
    status: 'paid',
    paid_at: now.toISOString(),
    paid_month: cycleMonth,
    paid_year: cycleYear,
    updated_at: now.toISOString(),
  }

  if (bill.isInstallment && bill.installmentPaid !== undefined && bill.installmentTotal !== undefined) {
    updates.installment_paid = Math.min(bill.installmentPaid + 1, bill.installmentTotal)
  }

  const { error: updError } = await supabase.from('bills').update(updates).eq('id', id)
  if (updError) throw new Error(updError.message)

  const userId = await getUserId()
  const { error: insError } = await supabase.from('payment_records').insert({
    user_id: userId,
    bill_id: id,
    amount: bill.amount,
    paid_at: now.toISOString(),
    month: cycleMonth,
    year: cycleYear,
  })
  if (insError) throw new Error(insError.message)
  invalidate(queryKeys.bills, queryKeys.paymentRecords, queryKeys.billHistory)
}

export async function markBillPending(id: string, cycleMonth: number, cycleYear: number): Promise<void> {
  const now = new Date().toISOString()
  const { data: billRaw, error: getError } = await supabase.from('bills').select('*').eq('id', id).maybeSingle()
  if (getError) throw new Error(getError.message)
  if (!billRaw) return
  const bill = mapBill(billRaw)

  const updates: Record<string, unknown> = {
    status: 'pending',
    paid_at: null,
    paid_month: null,
    paid_year: null,
    updated_at: now,
  }

  if (bill.isInstallment && bill.installmentPaid && bill.installmentPaid > 0) {
    updates.installment_paid = bill.installmentPaid - 1
  }

  const { error: updError } = await supabase.from('bills').update(updates).eq('id', id)
  if (updError) throw new Error(updError.message)

  const { data: records, error: recError } = await supabase
    .from('payment_records')
    .select('id')
    .eq('bill_id', id)
    .eq('month', cycleMonth)
    .eq('year', cycleYear)
  if (recError) throw new Error(recError.message)

  const last = records?.[records.length - 1]
  if (last) {
    const { error: delError } = await supabase.from('payment_records').delete().eq('id', last.id)
    if (delError) throw new Error(delError.message)
  }
  invalidate(queryKeys.bills, queryKeys.paymentRecords, queryKeys.billHistory)
}

// Reset recurring bills for a new month (call once per month)
export async function resetMonthlyBills(currentMonth: number, currentYear: number): Promise<void> {
  const bills = await getBills()
  const now = new Date().toISOString()

  for (const bill of bills) {
    if (bill.status !== 'paid') continue

    const isPaidThisMonth = bill.paidMonth === currentMonth && bill.paidYear === currentYear
    if (isPaidThisMonth) continue

    if (bill.isInstallment) {
      const paid = bill.installmentPaid ?? 0
      const total = bill.installmentTotal ?? 1
      if (paid >= total) continue // done, keep paid
    }

    if (!bill.isRecurring && !bill.isInstallment) continue

    const { error } = await supabase
      .from('bills')
      .update({ status: 'pending', paid_at: null, paid_month: null, paid_year: null, updated_at: now })
      .eq('id', bill.id!)
    if (error) throw new Error(error.message)
  }
  invalidate(queryKeys.bills)
}

// Bill payment history grouped by month
export interface BillHistoryEntry {
  billId: string
  billName: string
  amount: number
  paidAt: Date
  month: number
  year: number
}

export async function getBillHistory(): Promise<BillHistoryEntry[]> {
  const { data: recordsRaw, error } = await supabase
    .from('payment_records')
    .select('*')
    .order('paid_at', { ascending: false })
  throwIfError({ data: recordsRaw, error })

  const records = (recordsRaw ?? []).map(mapPaymentRecord)
  const billIds = [...new Set(records.map(r => r.billId))]
  if (billIds.length === 0) return []

  const { data: billsRaw, error: billsError } = await supabase.from('bills').select('id, name').in('id', billIds)
  if (billsError) throw new Error(billsError.message)
  const billMap = new Map((billsRaw ?? []).map(b => [b.id as string, b.name as string]))

  return records.map(r => ({
    billId: r.billId,
    billName: billMap.get(r.billId) ?? 'Conta removida',
    amount: r.amount,
    paidAt: r.paidAt,
    month: r.month,
    year: r.year,
  }))
}

export async function updateOverdueBills(): Promise<void> {
  const today = new Date()
  const currentDay = today.getDate()
  const { data, error } = await supabase.from('bills').select('id, due_day').eq('status', 'pending')
  throwIfError({ data, error })

  const overdueIds = (data ?? [])
    .filter(b => (b.due_day as number) < currentDay)
    .map(b => b.id as string)

  if (overdueIds.length > 0) {
    const { error: updError } = await supabase
      .from('bills')
      .update({ status: 'overdue' as BillStatus })
      .in('id', overdueIds)
    if (updError) throw new Error(updError.message)
    invalidate(queryKeys.bills)
  }
}

// ─── Investments ────────────────────────────────────────────
export async function getInvestments(): Promise<Investment[]> {
  const { data, error } = await supabase.from('investments').select('*').order('date', { ascending: false })
  throwIfError({ data, error })
  return (data ?? []).map(mapInvestment)
}

export async function addInvestment(inv: Omit<Investment, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('investments')
    .insert(toSnakeCase({ ...inv, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.investments)
  return row.id
}

export async function updateInvestment(id: string, changes: Partial<Investment>): Promise<void> {
  const { error } = await supabase
    .from('investments')
    .update(toSnakeCase({ ...changes, updatedAt: new Date() }))
    .eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.investments)
}

export async function deleteInvestment(id: string): Promise<void> {
  // withdrawals.investment_id is ON DELETE SET NULL (a fully-withdrawn
  // position must be able to close without erasing its withdrawal history),
  // so an explicit user-initiated delete purges them manually here instead.
  const { error: delWError } = await supabase.from('withdrawals').delete().eq('investment_id', id)
  if (delWError) throw new Error(delWError.message)
  const { error } = await supabase.from('investments').delete().eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.investments, queryKeys.withdrawals)
}

// ─── Withdrawals ────────────────────────────────────────────
export async function getWithdrawals(): Promise<Withdrawal[]> {
  const { data, error } = await supabase.from('withdrawals').select('*').order('date', { ascending: false })
  throwIfError({ data, error })
  return (data ?? []).map(mapWithdrawal)
}

export async function getWithdrawalsForInvestment(investmentId: string): Promise<Withdrawal[]> {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('investment_id', investmentId)
    .order('date', { ascending: false })
  throwIfError({ data, error })
  return (data ?? []).map(mapWithdrawal)
}

interface AddWithdrawalInput {
  investmentId: string
  amount: number
  quantity?: number
  date: Date
  notes?: string
}

// Withdraws money from an investment, shrinking its amount/quantity.
// `input.amount` is the cash actually received (market value for crypto, which
// may exceed the original cost basis). The investment's cost-basis `amount`
// is reduced proportionally to the share of quantity sold, not by the cash
// received — otherwise withdrawing appreciated crypto would zero it out early.
// If the withdrawal exhausts the position, the investment is closed (deleted).
// Money invested isn't treated as a monthly expense, so the withdrawn cash is
// logged as an income entry for that month — it only hits "disponível" now.
// The business logic lives in a Postgres RPC (`add_withdrawal`, see
// supabase/schema.sql) so the multi-table write stays atomic even over a
// flaky mobile connection — this now runs over the network, not IndexedDB.
export async function addWithdrawal(input: AddWithdrawalInput): Promise<string> {
  const { data, error } = await supabase.rpc('add_withdrawal', {
    p_investment_id: input.investmentId,
    p_amount: input.amount,
    p_quantity: input.quantity ?? null,
    p_date: input.date.toISOString(),
    p_notes: input.notes ?? null,
  })
  if (error) throw new Error(error.message)
  invalidate(queryKeys.investments, queryKeys.withdrawals, queryKeys.incomes)
  return data as string
}

// Reverses a withdrawal, restoring the amount/quantity to the investment
// (re-creating it if it had been fully withdrawn) and removing the income
// entry that was logged for the withdrawn cash. See `delete_withdrawal` RPC.
export async function deleteWithdrawal(id: string): Promise<void> {
  const { error } = await supabase.rpc('delete_withdrawal', { p_withdrawal_id: id })
  if (error) throw new Error(error.message)
  invalidate(queryKeys.investments, queryKeys.withdrawals, queryKeys.incomes)
}

// ─── Goals ─────────────────────────────────────────────────
export async function getGoals(): Promise<Goal[]> {
  const { data, error } = await supabase.from('goals').select('*')
  throwIfError({ data, error })
  return (data ?? []).map(mapGoal)
}

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('goals')
    .insert(toSnakeCase({ ...goal, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.goals)
  return row.id
}

export async function updateGoal(id: string, changes: Partial<Goal>): Promise<void> {
  const { error } = await supabase
    .from('goals')
    .update(toSnakeCase({ ...changes, updatedAt: new Date() }))
    .eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.goals)
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.goals)
}

// ─── Payment Records ────────────────────────────────────────
export async function getPaymentRecords(month: number, year: number): Promise<PaymentRecord[]> {
  const { data, error } = await supabase.from('payment_records').select('*').eq('month', month).eq('year', year)
  throwIfError({ data, error })
  return (data ?? []).map(mapPaymentRecord)
}

export async function addPaymentRecord(record: Omit<PaymentRecord, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('payment_records')
    .insert(toSnakeCase({ ...record, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.paymentRecords, queryKeys.billHistory)
  return row.id
}

// ─── Income Entries ─────────────────────────────────────────
export async function getIncomes(month: number, year: number): Promise<IncomeEntry[]> {
  const { data, error } = await supabase.from('incomes').select('*').eq('month', month).eq('year', year)
  throwIfError({ data, error })
  return (data ?? []).map(mapIncome)
}

export async function getAllIncomes(): Promise<IncomeEntry[]> {
  const { data, error } = await supabase.from('incomes').select('*')
  throwIfError({ data, error })
  return (data ?? []).map(mapIncome)
}

export async function addIncome(income: Omit<IncomeEntry, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('incomes')
    .insert(toSnakeCase({ ...income, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.incomes)
  return row.id
}

export async function updateIncome(id: string, changes: Partial<IncomeEntry>): Promise<void> {
  const { error } = await supabase
    .from('incomes')
    .update(toSnakeCase({ ...changes, updatedAt: new Date() }))
    .eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.incomes)
}

export async function deleteIncome(id: string): Promise<void> {
  const { error } = await supabase.from('incomes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.incomes)
}

// ─── Debit Expenses ──────────────────────────────────────────
export async function addDebitExpense(expense: Omit<DebitExpense, 'id'>): Promise<string> {
  const userId = await getUserId()
  const { data, error } = await supabase
    .from('debit_expenses')
    .insert(toSnakeCase({ ...expense, userId }))
    .select('id')
    .single()
  const row = throwIfError({ data, error })
  invalidate(queryKeys.debitExpenses)
  return row.id
}

export async function deleteDebitExpense(id: string): Promise<void> {
  const { error } = await supabase.from('debit_expenses').delete().eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.debitExpenses)
}

export async function updateDebitExpense(id: string, changes: Partial<DebitExpense>): Promise<void> {
  const { error } = await supabase.from('debit_expenses').update(toSnakeCase(changes)).eq('id', id)
  if (error) throw new Error(error.message)
  invalidate(queryKeys.debitExpenses)
}

export async function getMonthlyDebitExpenses(month: number, year: number): Promise<DebitExpense[]> {
  const { data, error } = await supabase.from('debit_expenses').select('*')
  throwIfError({ data, error })
  return (data ?? [])
    .map(mapDebitExpense)
    .filter(e => e.date.getFullYear() === year && e.date.getMonth() + 1 === month)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

// ─── Backup (operates on the CURRENT Supabase account) ────────────────
const BACKUP_TABLES = [
  'user_profiles', 'bills', 'investments', 'goals',
  'payment_records', 'incomes', 'debit_expenses', 'withdrawals',
] as const

export async function clearAllData(): Promise<void> {
  const userId = await getUserId()
  for (const table of BACKUP_TABLES) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  }
  invalidate(...Object.values(queryKeys))
}

export async function exportAllData() {
  const [userProfile, bills, investments, goals, paymentRecords, incomes, debitExpenses, withdrawals] = await Promise.all([
    getProfile(),
    getBills(),
    getInvestments(),
    getGoals(),
    supabase.from('payment_records').select('*').then(r => (r.data ?? []).map(mapPaymentRecord)),
    getAllIncomes(),
    supabase.from('debit_expenses').select('*').then(r => (r.data ?? []).map(mapDebitExpense)),
    getWithdrawals(),
  ])
  return {
    userProfile: userProfile ? [userProfile] : [],
    bills, investments, goals, paymentRecords, incomes, debitExpenses, withdrawals,
    exportedAt: new Date().toISOString(),
  }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await clearAllData()
  const userId = await getUserId()

  if (data.userProfile[0]) {
    await saveProfile(data.userProfile[0])
  }

  const investmentIdMap = new Map<string, string>()
  for (const inv of data.investments) {
    const newId = await addInvestment(inv)
    if (inv.id) investmentIdMap.set(inv.id, newId)
  }

  const incomeIdMap = new Map<string, string>()
  for (const income of data.incomes ?? []) {
    const newId = await addIncome(income)
    if (income.id) incomeIdMap.set(income.id, newId)
  }

  for (const goal of data.goals) await addGoal(goal)
  for (const expense of data.debitExpenses ?? []) await addDebitExpense(expense)

  const billIdMap = new Map<string, string>()
  for (const bill of data.bills) {
    const newId = await addBill(bill)
    if (bill.id) billIdMap.set(bill.id, newId)
  }

  for (const record of data.paymentRecords) {
    const newBillId = billIdMap.get(record.billId)
    if (!newBillId) continue
    await addPaymentRecord({ ...record, billId: newBillId })
  }

  for (const withdrawal of data.withdrawals ?? []) {
    const newInvestmentId = withdrawal.investmentId ? investmentIdMap.get(withdrawal.investmentId) : undefined
    const newIncomeEntryId = withdrawal.incomeEntryId ? incomeIdMap.get(withdrawal.incomeEntryId) : undefined
    await supabase.from('withdrawals').insert(toSnakeCase({
      ...withdrawal,
      id: undefined,
      userId,
      investmentId: newInvestmentId,
      incomeEntryId: newIncomeEntryId,
    }))
  }

  invalidate(...Object.values(queryKeys))
}

// ─── Local Dexie snapshot (one-time cloud migration source only) ──────
// Kept for `src/services/dataMigration.ts`, which reads whatever is still
// sitting in this browser's pre-login local storage and uploads it once.
// Not used anywhere else — `db.ts`/Dexie is no longer the live data path.
export async function getLocalDexieSnapshot() {
  const [userProfile, bills, investments, goals, paymentRecords, incomes, debitExpenses, withdrawals] = await Promise.all([
    db.userProfile.toArray(),
    db.bills.toArray(),
    db.investments.toArray(),
    db.goals.toArray(),
    db.paymentRecords.toArray(),
    db.incomes.toArray(),
    db.debitExpenses.toArray(),
    db.withdrawals.toArray(),
  ])
  return { userProfile, bills, investments, goals, paymentRecords, incomes, debitExpenses, withdrawals }
}

export async function hasLocalDexieData(): Promise<boolean> {
  const counts = await Promise.all([
    db.bills.count(), db.investments.count(), db.goals.count(),
    db.incomes.count(), db.debitExpenses.count(), db.userProfile.count(),
  ])
  return counts.some(c => c > 0)
}
