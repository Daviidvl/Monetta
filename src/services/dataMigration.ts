import { supabase } from '../lib/supabaseClient'
import { toSnakeCase } from '../database/caseMap'
import {
  getLocalDexieSnapshot, hasLocalDexieData,
  saveProfile, addInvestment, addIncome, addGoal, addDebitExpense, addBill, addPaymentRecord,
} from '../database/queries'

export { hasLocalDexieData }

// The legacy Dexie rows carry a numeric `id` (auto-increment) that isn't a
// valid Postgres uuid — it must never leak into an insert payload, or the
// write fails with "invalid input syntax for type uuid".
function stripId<T extends { id?: unknown }>(obj: T): Omit<T, 'id'> {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => key !== 'id')) as Omit<T, 'id'>
}

// One-time upload of whatever is sitting in this browser's pre-login Dexie
// storage into the newly-created Supabase account. Order matters: parents
// (investments, incomes, bills) are inserted first so their fresh uuids can
// be used to rewrite the FKs on the rows that reference them.
export async function migrateLocalDataToCloud(): Promise<void> {
  const snapshot = await getLocalDexieSnapshot()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const userId = user.id

  if (snapshot.userProfile[0]) {
    await saveProfile(stripId(snapshot.userProfile[0]))
  }

  const investmentIdMap = new Map<number, string>()
  for (const inv of snapshot.investments) {
    const newId = await addInvestment(stripId(inv))
    if (inv.id !== undefined) investmentIdMap.set(inv.id, newId)
  }

  const incomeIdMap = new Map<number, string>()
  for (const income of snapshot.incomes) {
    const newId = await addIncome(stripId(income))
    if (income.id !== undefined) incomeIdMap.set(income.id, newId)
  }

  for (const goal of snapshot.goals) await addGoal(stripId(goal))
  for (const expense of snapshot.debitExpenses) await addDebitExpense(stripId(expense))

  const billIdMap = new Map<number, string>()
  for (const bill of snapshot.bills) {
    const newId = await addBill(stripId(bill))
    if (bill.id !== undefined) billIdMap.set(bill.id, newId)
  }

  for (const record of snapshot.paymentRecords) {
    const newBillId = billIdMap.get(record.billId)
    if (!newBillId) continue
    await addPaymentRecord({ ...stripId(record), billId: newBillId })
  }

  for (const withdrawal of snapshot.withdrawals) {
    const newInvestmentId = investmentIdMap.get(withdrawal.investmentId)
    const newIncomeEntryId = withdrawal.incomeEntryId !== undefined
      ? incomeIdMap.get(withdrawal.incomeEntryId)
      : undefined

    const { error } = await supabase.from('withdrawals').insert(toSnakeCase({
      ...stripId(withdrawal),
      userId,
      investmentId: newInvestmentId,
      incomeEntryId: newIncomeEntryId,
    }))
    if (error) throw new Error(error.message)
  }
}
