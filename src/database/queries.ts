import { db } from './db'
import type { Bill, BillStatus, Goal, Investment, PaymentRecord, UserProfile } from '../types'

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
  await db.bills.update(id, { status: 'paid', paidAt: now, updatedAt: now })
}

export async function markBillPending(id: number): Promise<void> {
  const now = new Date()
  await db.bills.update(id, { status: 'pending', paidAt: undefined, updatedAt: now })
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
    await Promise.all(overdueIds.map(id => db.bills.update(id, { status: 'overdue' as BillStatus })))
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

// ─── Backup ─────────────────────────────────────────────────
export async function exportAllData() {
  const [userProfile, bills, investments, goals, paymentRecords] = await Promise.all([
    db.userProfile.toArray(),
    db.bills.toArray(),
    db.investments.toArray(),
    db.goals.toArray(),
    db.paymentRecords.toArray(),
  ])
  return { userProfile, bills, investments, goals, paymentRecords, exportedAt: new Date().toISOString() }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await db.transaction('rw', db.userProfile, db.bills, db.investments, db.goals, db.paymentRecords, async () => {
    await Promise.all([
      db.userProfile.clear(),
      db.bills.clear(),
      db.investments.clear(),
      db.goals.clear(),
      db.paymentRecords.clear(),
    ])
    await Promise.all([
      db.userProfile.bulkAdd(data.userProfile),
      db.bills.bulkAdd(data.bills),
      db.investments.bulkAdd(data.investments),
      db.goals.bulkAdd(data.goals),
      db.paymentRecords.bulkAdd(data.paymentRecords),
    ])
  })
}
