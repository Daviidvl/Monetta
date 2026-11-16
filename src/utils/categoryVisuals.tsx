import {
  Home, Zap, Car, Heart, GraduationCap, UtensilsCrossed, Clapperboard, Shirt, User, Repeat, Landmark,
  MoreHorizontal, PiggyBank, Building2, CandlestickChart, Bitcoin, Building, Briefcase, Gift, Laptop, Sun,
  ArrowDownToLine, type LucideIcon,
} from 'lucide-react'
import type { SelectOption } from '../components/ui/Select'
import type { BillCategory, IncomeCategory, InvestmentType, Priority } from '../types'
import { CATEGORY_LABELS, INCOME_CATEGORY_LABELS, INVESTMENT_TYPE_LABELS, PRIORITY_LABELS } from '../types'
import type { SegmentOption } from '../components/ui/SegmentedControl'

// Palette reused from the rest of the app (status colors + goal colors).
// Opacity modifiers must be on Tailwind's scale (10/15/20…) — off-scale ones
// like /12 silently generate no class.
const C = {
  violet: 'text-accent-500 bg-accent-500/10',
  amber:  'text-[#FFA534] bg-[#FFA534]/15',
  blue:   'text-[#36C5F4] bg-[#36C5F4]/15',
  red:    'text-[#FF5B6A] bg-[#FF5B6A]/15',
  green:  'text-[#2FBF73] bg-[#46D889]/15',
  teal:   'text-[#2BBFAE] bg-[#44E4D3]/15',
  yellow: 'text-[#D9A800] bg-[#FFD54A]/20',
  orange: 'text-[#F7931A] bg-[#F7931A]/15',
  gray:   'text-text-secondary bg-surface-100',
}

interface Visual { icon: LucideIcon; color: string; description?: string }

function toOptions<T extends string>(labels: Record<T, string>, visuals: Record<T, Visual>): SelectOption<T>[] {
  return (Object.keys(labels) as T[]).map(value => {
    const { icon: Icon, color, description } = visuals[value]
    return { value, label: labels[value], description, icon: <Icon size={16} strokeWidth={2} />, iconClass: color }
  })
}

const BILL_VISUALS: Record<BillCategory, Visual> = {
  housing:       { icon: Home,            color: C.violet },
  utilities:     { icon: Zap,             color: C.yellow },
  transport:     { icon: Car,             color: C.blue },
  health:        { icon: Heart,           color: C.red },
  education:     { icon: GraduationCap,   color: C.teal },
  food:          { icon: UtensilsCrossed, color: C.amber },
  entertainment: { icon: Clapperboard,    color: C.green },
  clothing:      { icon: Shirt,           color: C.violet },
  personal:      { icon: User,            color: C.blue },
  subscriptions: { icon: Repeat,          color: C.red },
  financing:     { icon: Landmark,        color: C.orange },
  other:         { icon: MoreHorizontal,  color: C.gray },
}

const INVESTMENT_VISUALS: Record<InvestmentType, Visual> = {
  savings:     { icon: PiggyBank,        color: C.green,  description: 'Liquidez diária e baixo risco' },
  treasury:    { icon: Landmark,         color: C.blue,   description: 'Títulos públicos: Selic, IPCA+ e Prefixado' },
  cdb:         { icon: Building2,        color: C.teal,   description: 'Renda fixa de bancos, com garantia do FGC' },
  stocks:      { icon: CandlestickChart, color: C.violet, description: 'Renda variável na bolsa de valores' },
  crypto:      { icon: Bitcoin,          color: C.orange, description: 'Bitcoin, Ethereum e outras — alta volatilidade' },
  real_estate: { icon: Building,         color: C.amber,  description: 'FIIs: renda mensal com imóveis' },
  other:       { icon: MoreHorizontal,   color: C.gray,   description: 'Previdência, COE, fundos e outros' },
}

const INCOME_VISUALS: Record<IncomeCategory, Visual> = {
  salary:                { icon: Briefcase,       color: C.green },
  bonus:                 { icon: Gift,            color: C.violet },
  freelance:             { icon: Laptop,          color: C.blue },
  vacation:              { icon: Sun,             color: C.amber },
  investment_withdrawal: { icon: ArrowDownToLine, color: C.teal },
  other:                 { icon: MoreHorizontal,  color: C.gray },
}

export const BILL_CATEGORY_OPTIONS     = toOptions(CATEGORY_LABELS, BILL_VISUALS)
export const INVESTMENT_TYPE_OPTIONS   = toOptions(INVESTMENT_TYPE_LABELS, INVESTMENT_VISUALS)
export const INCOME_CATEGORY_OPTIONS   = toOptions(INCOME_CATEGORY_LABELS, INCOME_VISUALS)

export const PRIORITY_OPTIONS: SegmentOption<Priority>[] = [
  { value: 'high',   label: PRIORITY_LABELS.high,   dotColor: '#FF5B6A' },
  { value: 'medium', label: PRIORITY_LABELS.medium, dotColor: '#FFA534' },
  { value: 'low',    label: PRIORITY_LABELS.low,    dotColor: '#A3A8B8' },
]
