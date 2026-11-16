import type { Bill, Investment } from '../types'

/**
 * The onboarding "objetivo principal" answer (profile.financialGoal) collapsed
 * into the three ways the app actually behaves. The raw goal keeps its 5
 * values in the DB — this mapping is the only place that decides behavior.
 */
export type FocusMode = 'debt' | 'invest' | 'organize'

export function getFocusMode(financialGoal: string | undefined): FocusMode {
  if (financialGoal === 'debt') return 'debt'
  if (financialGoal === 'invest') return 'invest'
  return 'organize'
}

export const FOCUS_MODE_LABELS: Record<FocusMode, string> = {
  debt:     'Sair das dívidas',
  invest:   'Investir',
  organize: 'Organizar',
}

export const GOAL_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'debt',      label: 'Sair das dívidas',              description: 'Quanto falta, ordem de quitação e a data em que você fica livre.' },
  { value: 'invest',    label: 'Começar a investir',            description: 'Patrimônio, reserva de emergência e quanto aportar por mês.' },
  { value: 'emergency', label: 'Criar reserva de emergência',   description: 'Foco em metas e em guardar um pouco todo mês.' },
  { value: 'buy',       label: 'Guardar para uma compra grande', description: 'Foco em metas e no prazo para chegar lá.' },
  { value: 'control',   label: 'Organizar meu orçamento',       description: 'Visão geral de contas, gastos e o que sobra.' },
]

// ─── Debt mode ───────────────────────────────────────────────────────────────

export interface DebtSummary {
  /** Active installment plans (not finished). */
  debts: Bill[]
  /** Everything still owed across all plans (remaining installments × amount). */
  totalOwed: number
  /** Total already paid across the same plans. */
  totalPaid: number
  /** 0–100, share of the combined debt already paid. */
  pctPaid: number
  /** Sum of the monthly installments. */
  monthlyCommitment: number
  /** Months until the longest plan ends — 0 when there's no debt. */
  monthsToFree: number
  /** The plan with the smallest remaining balance — snowball method's next target. */
  nextToClear: Bill | null
}

function remainingCount(b: Bill): number {
  return Math.max(0, (b.installmentTotal ?? 1) - (b.installmentPaid ?? 0))
}

export function remainingBalance(b: Bill): number {
  return remainingCount(b) * b.amount
}

export function summarizeDebts(installments: Bill[]): DebtSummary {
  const debts = installments.filter(b => remainingCount(b) > 0)
  const totalOwed = debts.reduce((s, b) => s + remainingBalance(b), 0)
  const totalPaid = debts.reduce((s, b) => s + (b.installmentPaid ?? 0) * b.amount, 0)
  const grand = totalOwed + totalPaid
  const nextToClear = [...debts].sort((a, b) => remainingBalance(a) - remainingBalance(b))[0] ?? null

  return {
    debts,
    totalOwed,
    totalPaid,
    pctPaid: grand > 0 ? Math.round((totalPaid / grand) * 100) : 0,
    monthlyCommitment: debts.reduce((s, b) => s + b.amount, 0),
    monthsToFree: debts.reduce((m, b) => Math.max(m, remainingCount(b)), 0),
    nextToClear,
  }
}

/** "março de 2027" — the month the last installment is due. */
export function debtFreeLabel(monthsToFree: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth() + monthsToFree, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

// ─── Invest mode ─────────────────────────────────────────────────────────────

const LIQUID_TYPES = new Set(['savings', 'treasury', 'cdb'])
const RESERVE_MONTHS = 6

export interface ReserveStatus {
  /** What's already in liquid investments (poupança, Tesouro, CDB). */
  liquid: number
  /** 6 months of the user's monthly cost of living. */
  target: number
  pct: number
  done: boolean
  missing: number
}

export function getEmergencyReserve(investments: Investment[], monthlyCost: number): ReserveStatus {
  const liquid = investments.filter(i => LIQUID_TYPES.has(i.type)).reduce((s, i) => s + i.amount, 0)
  const target = Math.max(0, monthlyCost * RESERVE_MONTHS)
  const pct = target > 0 ? Math.min(100, Math.round((liquid / target) * 100)) : 0
  return {
    liquid,
    target,
    pct,
    done: target > 0 && liquid >= target,
    missing: Math.max(0, target - liquid),
  }
}
