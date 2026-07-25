import Dexie, { type Table } from 'dexie'
import type {
  LegacyBill, LegacyDebitExpense, LegacyGoal, LegacyIncomeEntry,
  LegacyInvestment, LegacyPaymentRecord, LegacyUserProfile, LegacyWithdrawal,
} from './legacyTypes'

// This Dexie/IndexedDB database is no longer the live data store (Supabase
// is, since the multi-device login migration) — it's kept read-only, only
// to let a first login pull in whatever was saved locally before that
// migration. Table generics use the Legacy* (numeric-id) shapes on purpose.
class MonettaDB extends Dexie {
  userProfile!: Table<LegacyUserProfile>
  bills!: Table<LegacyBill>
  investments!: Table<LegacyInvestment>
  goals!: Table<LegacyGoal>
  paymentRecords!: Table<LegacyPaymentRecord>
  incomes!: Table<LegacyIncomeEntry>
  debitExpenses!: Table<LegacyDebitExpense>
  withdrawals!: Table<LegacyWithdrawal>

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
