import { Card, CardTitle } from '../../components/ui/Card'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { formatCurrency } from '../../utils/format'
import type { CategorySpend } from '../../utils/spending'

export function SpendingBreakdown({ items }: { items: CategorySpend[] }) {
  if (items.length === 0) return null
  const top = items.slice(0, 6)

  return (
    <Card padded={false}>
      <div className="p-4">
        <CardTitle>Para onde vai seu dinheiro</CardTitle>
        <div className="mt-4 space-y-3">
          {top.map(item => (
            <div key={item.category}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm text-text-primary">{item.label}</p>
                <p className="text-xs text-text-muted">{formatCurrency(item.amount)} · {item.pctOfIncome}%</p>
              </div>
              <ProgressBar
                value={item.pctOfIncome}
                max={100}
                size="sm"
                color={item.pctOfIncome > 30 ? '#FF5B6A' : '#7A2FFF'}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
