export interface GoalSimResult {
  monthlyNeeded: number
  feasible: boolean
  /** Positivo = falta esse valor por mês para bater o prazo. */
  gap: number
  /** Em quantos meses chegaria lá guardando todo o disponível atual (null se disponível <= 0). */
  monthsAtCurrentPace: number | null
}

export function simulateGoal(targetAmount: number, months: number, available: number): GoalSimResult {
  const monthlyNeeded = months > 0 ? targetAmount / months : 0
  const gap = monthlyNeeded - available
  return {
    monthlyNeeded,
    feasible: gap <= 0,
    gap,
    monthsAtCurrentPace: available > 0 ? Math.ceil(targetAmount / available) : null,
  }
}

export interface WealthProjectionPoint {
  months: number
  value: number
}

/** Projeção linear simples: patrimônio atual + ritmo mensal de poupança repetido N meses. */
export function projectWealth(baseline: number, monthlyRate: number, horizons: number[] = [3, 6, 12]): WealthProjectionPoint[] {
  return horizons.map(months => ({ months, value: baseline + monthlyRate * months }))
}
