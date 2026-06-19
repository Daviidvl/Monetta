import Dexie, { type Table } from 'dexie'
import type { Bill, Goal, Investment, PaymentRecord, UserProfile } from '../types'

class MonettaDB extends Dexie {
  userProfile!: Table<UserProfile>
  bills!: Table<Bill>
  investments!: Table<Investment>
  goals!: Table<Goal>
  paymentRecords!: Table<PaymentRecord>

  constructor() {
    super('MonettaDB')

    this.version(1).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category',
      investments:    '++id, type, date',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
    })
  }
}

export const db = new MonettaDB()
