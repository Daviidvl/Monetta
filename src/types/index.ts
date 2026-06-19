export type Theme = 'light' | 'dark'
export type BillStatus = 'pending' | 'paid' | 'overdue'
export type Priority = 'high' | 'medium' | 'low'
export type InvestmentType = 'savings' | 'treasury' | 'cdb' | 'stocks' | 'crypto' | 'real_estate' | 'other'

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
  id?: number
  name: string
  monthlyIncome: number
  paymentDay: number
  financialGoal: string
  theme: Theme
  createdAt: Date
  updatedAt: Date
}

export interface Bill {
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

export interface Investment {
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

export interface Goal {
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

export interface PaymentRecord {
  id?: number
  billId: number
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
export type IncomeCategory = 'salary' | 'bonus' | 'freelance' | 'vacation' | 'other'

export interface IncomeEntry {
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

export const INCOME_CATEGORY_LABELS: Record<IncomeCategory, string> = {
  salary:    'Salário',
  bonus:     'Bônus / 13º',
  freelance: 'Freela / Renda extra',
  vacation:  'Férias',
  other:     'Outros',
}

export const INCOME_CATEGORY_ICONS: Record<IncomeCategory, string> = {
  salary:    '$',
  bonus:     '+',
  freelance: '✦',
  vacation:  '☀',
  other:     '·',
}

export const GOAL_COLORS = [
  '#635BFF',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#14B8A6',
]
