import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import type { Goal } from '../../types'
import { parseNumber, formatCurrency } from '../../utils/format'
import { addGoalDeposit } from '../../database/queries'
import { useToastStore } from '../../store/useToastStore'

interface GoalDepositFormProps {
  goal: Goal
  onClose: () => void
}

export function GoalDepositForm({ goal, onClose }: GoalDepositFormProps) {
  const [loading, setLoading] = useState(false)
  const [amount, setAmount]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]     = useState('')
  const pushToast = useToastStore(s => s.push)

  const parsedAmount = parseNumber(amount)
  const isValid = parsedAmount > 0

  const remainingToTarget = Math.max(0, goal.targetAmount - goal.currentAmount)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !goal.id) return
    setLoading(true)
    try {
      await addGoalDeposit({
        goalId: goal.id,
        amount: parsedAmount,
        date: new Date(`${date}T12:00:00`),
        notes: notes.trim() || undefined,
      })
      onClose()
    } catch (err) {
      pushToast({ message: err instanceof Error ? err.message : 'Não foi possível guardar o valor.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-surface-50 px-3.5 py-3">
        <p className="text-xs text-text-muted mb-0.5">Guardado até agora</p>
        <p className="text-sm font-semibold text-text-primary">
          {formatCurrency(goal.currentAmount)}
          <span className="text-text-muted font-normal"> de {formatCurrency(goal.targetAmount)}</span>
        </p>
        {remainingToTarget > 0 && (
          <p className="text-[11px] text-text-muted mt-1">
            Faltam {formatCurrency(remainingToTarget)} para bater a meta.
          </p>
        )}
      </div>

      <Input
        label="Valor (R$)"
        type="number"
        step="0.01"
        placeholder="0,00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        prefix={<span className="text-xs font-medium">R$</span>}
      />

      {remainingToTarget > 0 && (
        <button
          type="button"
          onClick={() => setAmount(String(remainingToTarget))}
          className="text-xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
        >
          Completar meta ({formatCurrency(remainingToTarget)})
        </button>
      )}

      <Input
        label="Data"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />

      <Textarea
        label="Observações (opcional)"
        placeholder="Origem do dinheiro..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          Guardar
        </Button>
      </div>
    </form>
  )
}
