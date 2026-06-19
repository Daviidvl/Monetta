export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(value)
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return formatCurrency(value)
}

export function formatPercent(value: number, total: number): string {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
}

export function formatPercentNumber(value: number): string {
  return `${Math.round(value)}%`
}

export function parseNumber(value: string): number {
  const clean = value.replace(/[^\d,.-]/g, '').replace(',', '.')
  const num = parseFloat(clean)
  return isNaN(num) ? 0 : num
}
