import { useMemo, useState } from 'react'
import { Card, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { formatCurrency, parseNumber } from '../../utils/format'
import { formatMonths } from '../../utils/goals'
import { simulateGoal } from '../../utils/planning'

interface GoalSimulatorProps {
  /** Disponível deste mês (saldo livre depois de contas, gastos e o que já foi guardado). */
  available: number
}

export function GoalSimulator({ available }: GoalSimulatorProps) {
  const [amountInput, setAmountInput] = useState('')
  const [monthsInput, setMonthsInput] = useState('')

  const amount = parseNumber(amountInput)
  const months = parseInt(monthsInput, 10) || 0
  const safeAvailable = Math.max(0, available)

  const result = useMemo(
    () => (amount > 0 && months > 0 ? simulateGoal(amount, months, safeAvailable) : null),
    [amount, months, safeAvailable],
  )

  return (
    <Card>
      <CardTitle>Quanto preciso guardar?</CardTitle>
      <p className="text-xs text-text-muted mt-1 mb-4">
        Informe um valor e um prazo para calcular o aporte mensal necessário.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor desejado"
          prefix="R$"
          type="number"
          inputMode="decimal"
          value={amountInput}
          onChange={e => setAmountInput(e.target.value)}
          placeholder="0,00"
        />
        <Input
          label="Prazo"
          suffix="meses"
          type="number"
          inputMode="numeric"
          value={monthsInput}
          onChange={e => setMonthsInput(e.target.value)}
          placeholder="12"
        />
      </div>

      {result && (
        <div className={`mt-4 p-3.5 rounded-xl ${result.feasible ? 'bg-status-success/8' : 'bg-status-warning/8'}`}>
          <p className="text-sm text-text-primary">
            Você precisa guardar <span className="font-semibold">{formatCurrency(result.monthlyNeeded)}/mês</span>.
          </p>
          {result.feasible ? (
            <p className="text-xs text-status-success mt-1">
              Cabe no seu disponível atual ({formatCurrency(safeAvailable)}/mês).
            </p>
          ) : (
            <p className="text-xs text-status-warning mt-1">
              Faltam {formatCurrency(result.gap)}/mês em relação ao seu disponível ({formatCurrency(safeAvailable)}/mês).
              {result.monthsAtCurrentPace != null && (
                <> Guardando todo o disponível, você chega lá em {formatMonths(result.monthsAtCurrentPace)}.</>
              )}
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
