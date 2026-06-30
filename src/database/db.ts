import Dexie, { type Table } from 'dexie'
import type { Bill, DebitExpense, Goal, IncomeEntry, Investment, PaymentRecord, UserProfile, Withdrawal } from '../types'

class MonettaDB extends Dexie {
  userProfile!: Table<UserProfile>
  bills!: Table<Bill>
  investments!: Table<Investment>
  goals!: Table<Goal>
  paymentRecords!: Table<PaymentRecord>
  incomes!: Table<IncomeEntry>
  debitExpenses!: Table<DebitExpense>
  withdrawals!: Table<Withdrawal>

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

    this.version(4).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category, paidMonth, paidYear',
      investments:    '++id, type, date, coinId',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
      incomes:        '++id, month, year, category, isRecurring',
      debitExpenses:  '++id, category, date',
    })

    this.version(5).stores({
      userProfile:    '++id',
      bills:          '++id, status, priority, dueDay, isRecurring, isInstallment, category, paidMonth, paidYear',
      investments:    '++id, type, date, coinId',
      goals:          '++id',
      paymentRecords: '++id, billId, month, year, paidAt',
      incomes:        '++id, month, year, category, isRecurring',
      debitExpenses:  '++id, category, date',
      withdrawals:    '++id, investmentId, date',
    })
  }
}

export const db = new MonettaDB()
