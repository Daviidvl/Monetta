import { Card, CardTitle } from '../../components/ui/Card'
import { formatCurrencyCompact, formatCurrency } from '../../utils/format'
import { projectWealth } from '../../utils/planning'

interface WealthProjectionProps {
  /** Total já investido + guardado em metas até agora. */
  baseline: number
  /** Ritmo mensal de poupança (investimentos + aportes em metas deste mês). */
  monthlyRate: number
}

export function WealthProjection({ baseline, monthlyRate }: WealthProjectionProps) {
  const points = projectWealth(baseline, monthlyRate)

  return (
    <Card padded={false}>
      <div className="p-4">
        <CardTitle>Projeção de patrimônio</CardTitle>
        {monthlyRate > 0 ? (
          <>
            <p className="text-xs text-text-muted mt-1 mb-4">
              Mantendo o ritmo de {formatCurrency(monthlyRate)}/mês guardados.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {points.map(p => (
                <div key={p.months} className="text-center p-3 rounded-2xl bg-surface-50">
                  <p className="text-[10px] text-text-muted mb-1">{p.months === 12 ? '1 ano' : `${p.months} meses`}</p>
                  <p className="text-sm font-semibold text-text-primary">{formatCurrencyCompact(p.value)}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-text-muted mt-2">
            Você ainda não guardou nada este mês. Guarde regularmente para ver sua projeção de patrimônio.
          </p>
        )}
      </div>
    </Card>
  )
}
