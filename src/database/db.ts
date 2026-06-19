import Dexie, { type Table } from 'dexie'
import type { Bill, Goal, IncomeEntry, Investment, PaymentRecord, UserProfile } from '../types'

class MonettaDB extends Dexie {
  userProfile!: Table<UserProfile>
  bills!: Table<Bill>
  investments!: Table<Investment>
  goals!: Table<Goal>
  paymentRecords!: Table<PaymentRecord>
  incomes!: Table<IncomeEntry>

  constructor() {
    super('MonettaDB')

    this.version(1).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category',
      investments:    '++id, type, date',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
    })

    this.version(2).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category',
      investments:    '++id, type, date',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
      incomes:        '++id, month, year, category, isRecurring',
    })

    this.version(3).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category, paidMonth, paidYear',
      investments:    '++id, type, date, coinId',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
      incomes:        '++id, month, year, category, isRecurring',
    })
  }
}

export const db = new MonettaDB()
