import { db } from './db'
import type { Bill, BillStatus, DebitExpense, Goal, IncomeEntry, Investment, PaymentRecord, UserProfile } from '../types'

// ─── UserProfile ───────────────────────────────────────────
export async function getProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.orderBy('id').first()
}

export async function saveProfile(profile: Omit<UserProfile, 'id'>): Promise<number> {
  const existing = await getProfile()
  if (existing?.id) {
    await db.userProfile.update(existing.id, { ...profile, updatedAt: new Date() })
    return existing.id
  }
  return db.userProfile.add(profile)
}

export async function updateMonthlyIncome(amount: number): Promise<void> {
  const existing = await getProfile()
  if (existing?.id) {
    await db.userProfile.update(existing.id, { monthlyIncome: amount, updatedAt: new Date() })
  }
}

// ─── Bills ─────────────────────────────────────────────────
export async function getBills(): Promise<Bill[]> {
  return db.bills.orderBy('dueDay').toArray()
}

export async function addBill(bill: Omit<Bill, 'id'>): Promise<number> {
  return db.bills.add(bill)
}

export async function updateBill(id: number, changes: Partial<Bill>): Promise<void> {
  await db.bills.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteBill(id: number): Promise<void> {
  await db.bills.delete(id)
  await db.paymentRecords.where('billId').equals(id).delete()
}

export async function markBillPaid(id: number): Promise<void> {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const bill = await db.bills.get(id)
  if (!bill) return

  const updates: Partial<Bill> = {
    status: 'paid',
    paidAt: now,
    paidMonth: month,
    paidYear: year,
    updatedAt: now,
  }

  // Increment installment counter
  if (bill.isInstallment && bill.installmentPaid !== undefined && bill.installmentTotal !== undefined) {
    updates.installmentPaid = Math.min(bill.installmentPaid + 1, bill.installmentTotal)
  }

  await db.bills.update(id, updates)

  // Create payment record
  await db.paymentRecords.add({
    billId: id,
    amount: bill.amount,
    paidAt: now,
    month,
    year,
  })
}

export async function markBillPending(id: number): Promise<void> {
  const now = new Date()
  const bill = await db.bills.get(id)
  if (!bill) return

  // Undo installment increment if it was paid this month
  const updates: Partial<Bill> = {
    status: 'pending',
    paidAt: undefined,
    paidMonth: undefined,
    paidYear: undefined,
    updatedAt: now,
  }

  if (bill.isInstallment && bill.installmentPaid && bill.installmentPaid > 0) {
    updates.installmentPaid = bill.installmentPaid - 1
  }

  await db.bills.update(id, updates)

  // Remove the payment record for this month
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const records = await db.paymentRecords.where({ billId: id, month, year }).toArray()
  if (records.length > 0) {
    await db.paymentRecords.delete(records[records.length - 1].id!)
  }
}

// Reset recurring bills for a new month (call once per month)
export async function resetMonthlyBills(currentMonth: number, currentYear: number): Promise<void> {
  const bills = await db.bills.toArray()
  const now = new Date()

  for (const bill of bills) {
    if (bill.status !== 'paid') continue

    const isPaidThisMonth = bill.paidMonth === currentMonth && bill.paidYear === currentYear
    if (isPaidThisMonth) continue

    // Installment: fully paid → stays paid
    if (bill.isInstallment) {
      const paid = bill.installmentPaid ?? 0
      const total = bill.installmentTotal ?? 1
      if (paid >= total) continue // done, keep paid
    }

    // Non-recurring one-time bill → keep paid
    if (!bill.isRecurring && !bill.isInstallment) continue

    // Reset to pending
    await db.bills.update(bill.id!, {
      status: 'pending',
      paidAt: undefined,
      paidMonth: undefined,
      paidYear: undefined,
      updatedAt: now,
    })
  }
}

// Bill payment history grouped by month
export interface BillHistoryEntry {
  billId: number
  billName: string
  amount: number
  paidAt: Date
  month: number
  year: number
}

export async function getBillHistory(): Promise<BillHistoryEntry[]> {
  const records = await db.paymentRecords.orderBy('paidAt').reverse().toArray()
  const billIds = [...new Set(records.map(r => r.billId))]
  const billsRaw = await db.bills.bulkGet(billIds)
  const billMap = new Map(billsRaw.filter(Boolean).map(b => [b!.id!, b!]))

  return records.map(r => ({
    billId: r.billId,
    billName: billMap.get(r.billId)?.name ?? 'Conta removida',
    amount: r.amount,
    paidAt: r.paidAt,
    month: r.month,
    year: r.year,
  }))
}

export async function updateOverdueBills(): Promise<void> {
  const today = new Date()
  const currentDay = today.getDate()
  const bills = await db.bills.where('status').equals('pending').toArray()
  const overdueIds = bills
    .filter(b => b.dueDay < currentDay)
    .map(b => b.id!)
    .filter(Boolean)
  if (overdueIds.length > 0) {
    await Promise.all(overdueIds.map(id =>
      db.bills.update(id, { status: 'overdue' as BillStatus })
    ))
  }
}

// ─── Investments ────────────────────────────────────────────
export async function getInvestments(): Promise<Investment[]> {
  return db.investments.orderBy('date').reverse().toArray()
}

export async function addInvestment(inv: Omit<Investment, 'id'>): Promise<number> {
  return db.investments.add(inv)
}

export async function updateInvestment(id: number, changes: Partial<Investment>): Promise<void> {
  await db.investments.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteInvestment(id: number): Promise<void> {
  await db.investments.delete(id)
}

// ─── Goals ─────────────────────────────────────────────────
export async function getGoals(): Promise<Goal[]> {
  return db.goals.toArray()
}

export async function addGoal(goal: Omit<Goal, 'id'>): Promise<number> {
  return db.goals.add(goal)
}

export async function updateGoal(id: number, changes: Partial<Goal>): Promise<void> {
  await db.goals.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteGoal(id: number): Promise<void> {
  await db.goals.delete(id)
}

// ─── Payment Records ────────────────────────────────────────
export async function getPaymentRecords(month: number, year: number): Promise<PaymentRecord[]> {
  return db.paymentRecords.where({ month, year }).toArray()
}

export async function addPaymentRecord(record: Omit<PaymentRecord, 'id'>): Promise<number> {
  return db.paymentRecords.add(record)
}

// ─── Income Entries ─────────────────────────────────────────
export async function getIncomes(month: number, year: number) {
  return db.incomes.where({ month, year }).toArray()
}

export async function getAllIncomes() {
  return db.incomes.toArray()
}

export async function addIncome(income: Omit<IncomeEntry, 'id'>) {
  return db.incomes.add(income)
}

export async function updateIncome(id: number, changes: Partial<IncomeEntry>) {
  await db.incomes.update(id, { ...changes, updatedAt: new Date() })
}

export async function deleteIncome(id: number) {
  await db.incomes.delete(id)
}

// ─── Debit Expenses ──────────────────────────────────────────
export async function addDebitExpense(expense: Omit<DebitExpense, 'id'>): Promise<number> {
  return db.debitExpenses.add(expense)
}

export async function deleteDebitExpense(id: number): Promise<void> {
  await db.debitExpenses.delete(id)
}

export async function updateDebitExpense(id: number, changes: Partial<DebitExpense>): Promise<void> {
  await db.debitExpenses.update(id, changes)
}

// ─── Clear ───────────────────────────────────────────────────
export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.userProfile, db.bills, db.investments, db.goals, db.paymentRecords, db.incomes, db.debitExpenses], async () => {
    await Promise.all([
      db.userProfile.clear(),
      db.bills.clear(),
      db.investments.clear(),
      db.goals.clear(),
      db.paymentRecords.clear(),
      db.incomes.clear(),
      db.debitExpenses.clear(),
    ])
  })
}

// ─── Backup ─────────────────────────────────────────────────
export async function exportAllData() {
  const [userProfile, bills, investments, goals, paymentRecords, incomes, debitExpenses] = await Promise.all([
    db.userProfile.toArray(),
    db.bills.toArray(),
    db.investments.toArray(),
    db.goals.toArray(),
    db.paymentRecords.toArray(),
    db.incomes.toArray(),
    db.debitExpenses.toArray(),
  ])
  return { userProfile, bills, investments, goals, paymentRecords, incomes, debitExpenses, exportedAt: new Date().toISOString() }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await db.transaction('rw', [db.userProfile, db.bills, db.investments, db.goals, db.paymentRecords, db.incomes, db.debitExpenses], async () => {
    await Promise.all([
      db.userProfile.clear(), db.bills.clear(), db.investments.clear(),
      db.goals.clear(), db.paymentRecords.clear(), db.incomes.clear(), db.debitExpenses.clear(),
    ])
    await Promise.all([
      db.userProfile.bulkAdd(data.userProfile),
      db.bills.bulkAdd(data.bills),
      db.investments.bulkAdd(data.investments),
      db.goals.bulkAdd(data.goals),
      db.paymentRecords.bulkAdd(data.paymentRecords),
      data.incomes ? db.incomes.bulkAdd(data.incomes) : Promise.resolve(),
      data.debitExpenses ? db.debitExpenses.bulkAdd(data.debitExpenses) : Promise.resolve(),
    ])
  })
}
