import { Receipt, Wallet, Target, TrendingUp, type LucideIcon } from 'lucide-react'

export interface QuickAction {
  label: string
  icon: LucideIcon
  to: string
}

export const QUICK_ACTIONS: QuickAction[] = [
  { label: 'Nova conta',        icon: Receipt,    to: '/contas?add=1' },
  { label: 'Novo gasto',        icon: Wallet,     to: '/gastos?add=1' },
  { label: 'Nova meta',         icon: Target,     to: '/metas?add=1' },
  { label: 'Novo investimento', icon: TrendingUp, to: '/investimentos?add=1' },
]
