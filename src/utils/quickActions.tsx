import { Receipt, Wallet, Target, TrendingUp, type LucideIcon } from 'lucide-react'
import type { FocusMode } from './focusMode'

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

// Same four actions, leading with whatever the user's focus mode cares about.
const ORDER: Record<FocusMode, string[]> = {
  debt:     ['/contas?add=1', '/gastos?add=1', '/metas?add=1', '/investimentos?add=1'],
  invest:   ['/investimentos?add=1', '/metas?add=1', '/gastos?add=1', '/contas?add=1'],
  organize: QUICK_ACTIONS.map(a => a.to),
}

export function quickActionsFor(mode: FocusMode): QuickAction[] {
  return ORDER[mode].map(to => QUICK_ACTIONS.find(a => a.to === to)!)
}
