// Shapes of the OLD Dexie-only records (numeric auto-increment ids), kept
// only so `db.ts` and the one-time local->cloud migration can read whatever
// is still sitting in a browser's pre-login IndexedDB. The rest of the app
// uses the UUID-based shapes in `../types` (Supabase is now the live store).
import type {
  BillCategory, BillStatus, Priority, InvestmentType, IncomeFrequency,
  IncomeCategory, ExpenseCategory, Theme,
} from '../types'

export interface LegacyUserProfile {
  id?: number
  name: string
  monthlyIncome: number
  incomeFrequency: IncomeFrequency
  incomeAmount: number
  incomeAmountSecondary?: number
  workDaysPerMonth?: number
  paymentDay: number
  financialGoal: string
  theme: Theme
  createdAt: Date
  updatedAt: Date
}

export interface LegacyBill {
  id?: number
  name: string
  category: BillCategory
  amount: number
  dueDay: number
  priority: Priority
  isRecurring: boolean
  isInstallment: boolean
  installmentTotal?: number
  installmentPaid?: number
  notes?: string
  status: BillStatus
  paidAt?: Date
  paidMonth?: number
  paidYear?: number
  createdAt: Date
  updatedAt: Date
}

export interface LegacyInvestment {
  id?: number
  name: string
  type: InvestmentType
  platform: string
  amount: number
  quantity?: number
  coinId?: string
  coinSymbol?: string
  date: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface LegacyWithdrawal {
  id?: number
  investmentId: number
  investmentName: string
  investmentType: InvestmentType
  investmentPlatform: string
  coinId?: string
  coinSymbol?: string
  amount: number
  costBasis: number
  quantity?: number
  date: Date
  notes?: string
  createdAt: Date
  incomeEntryId?: number
}

export interface LegacyGoal {
  id?: number
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: Date
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface LegacyPaymentRecord {
  id?: number
  billId: number
  amount: number
  paidAt: Date
  month: number
  year: number
  notes?: string
}

export interface LegacyIncomeEntry {
  id?: number
  name: string
  category: IncomeCategory
  amount: number
  month: number
  year: number
  isRecurring: boolean
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface LegacyDebitExpense {
  id?: number
  description: string
  amount: number
  category: ExpenseCategory
  date: Date
  createdAt: Date
}
