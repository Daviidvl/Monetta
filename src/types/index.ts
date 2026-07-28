export type Theme = 'light' | 'dark'
export type BillStatus = 'pending' | 'paid' | 'overdue'
export type Priority = 'high' | 'medium' | 'low'
export type InvestmentType = 'savings' | 'treasury' | 'cdb' | 'stocks' | 'crypto' | 'real_estate' | 'other'
export type IncomeFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'variable'

export type BillCategory =
  | 'housing'
  | 'utilities'
  | 'transport'
  | 'health'
  | 'education'
  | 'food'
  | 'entertainment'
  | 'clothing'
  | 'personal'
  | 'subscriptions'
  | 'financing'
  | 'other'

export interface UserProfile {
  id?: string
  name: string
  /** Always normalized to a monthly total, regardless of incomeFrequency — used in all money math. */
  monthlyIncome: number
  /** How the user actually gets paid. */
  incomeFrequency: IncomeFrequency
  /** Primary amount entered — meaning depends on frequency (daily rate, weekly amount, 1st quinzena, or the monthly figure itself for 'monthly'/'variable'). */
  incomeAmount: number
  /** Only for 'biweekly' — the 2nd payment of the month, when it differs from the 1st. */
  incomeAmountSecondary?: number
  /** Only for 'daily' — how many days a month are actually worked (defaults to 22). */
  workDaysPerMonth?: number
  paymentDay: number
  financialGoal: string
  theme: Theme
  createdAt: Date
  updatedAt: Date
}

export const INCOME_FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  daily:    'Diário',
  weekly:   'Semanal',
  biweekly: 'Quinzenal',
  monthly:  'Mensal',
  variable: 'Variável',
}

export interface Bill {
  id?: string
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

export interface Investment {
  id?: string
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

export interface Withdrawal {
  id?: string
  investmentId?: string
  investmentName: string
  investmentType: InvestmentType
  investmentPlatform: string
  coinId?: string
  coinSymbol?: string
  /** Cash value actually received at withdrawal time (market value for crypto). */
  amount: number
  /** Portion of the investment's original cost basis removed by this withdrawal. */
  costBasis: number
  quantity?: number
  date: Date
  notes?: string
  createdAt: Date
  /** IncomeEntry created alongside this withdrawal (amount counted as income for the month). */
  incomeEntryId?: string
}

export interface Goal {
  id?: string
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  deadline?: Date
  color: string
  createdAt: Date
  updatedAt: Date
}

export interface PaymentRecord {
  id?: string
  billId: string
  amount: number
  paidAt: Date
  month: number
  year: number
  notes?: string
}

export const CATEGORY_LABELS: Record<BillCategory, string> = {
  housing: 'Moradia',
  utilities: 'Utilidades',
  transport: 'Transporte',
  health: 'Saúde',
  education: 'Educação',
  food: 'Alimentação',
  entertainment: 'Lazer',
  clothing: 'Vestuário',
  personal: 'Pessoal',
  subscriptions: 'Assinaturas',
  financing: 'Financiamento',
  other: 'Outros',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
}

export const INVESTMENT_TYPE_LABELS: Record<InvestmentType, string> = {
  savings: 'Poupança',
  treasury: 'Tesouro Direto',
  cdb: 'CDB',
  stocks: 'Ações',
  crypto: 'Criptomoedas',
  real_estate: 'Fundos Imobiliários',
  other: 'Outros',
}

export const STATUS_LABELS: Record<BillStatus, string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Atrasado',
}

// ─── Income ──────────────────────────────────────────────────
export type IncomeCategory = 'salary' | 'bonus' | 'freelance' | 'vacation' | 'investment_withdrawal' | 'other'

export interface IncomeEntry {
  id?: string
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

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary:                'Salário',
  bonus:                 'Bônus / 13º',
  freelance:             'Freela / Renda extra',
  vacation:              'Férias',
  investment_withdrawal: 'Saque de investimento',
  other:                 'Outros',
}

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  salary:                '$',
  bonus:                 '+',
  freelance:             '✦',
  vacation:              '☀',
  investment_withdrawal: '↓',
  other:                 '·',
}

// ─── Debit Expenses ──────────────────────────────────────────
export type ExpenseCategory = 'food' | 'transport' | 'health' | 'shopping' | 'entertainment' | 'other'

export interface DebitExpense {
  id?: string
  description: string
  amount: number
  category: ExpenseCategory
  date: Date
  createdAt: Date
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food:          'Alimentação',
  transport:     'Transporte',
  health:        'Saúde',
  shopping:      'Compras',
  entertainment: 'Lazer',
  other:         'Outros',
}

export const GOAL_COLORS = [
  '#7A2FFF',
  '#46D889',
  '#FFA534',
  '#FF5B6A',
  '#36C5F4',
  '#9255FF',
  '#FFD54A',
  '#44E4D3',
]
