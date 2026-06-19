import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import type { Goal } from '../../types'
import { GOAL_COLORS } from '../../types'
import { parseNumber } from '../../utils/format'
import { addGoal, updateGoal } from '../../database/queries'
import { cn } from '../../utils/cn'

interface GoalFormProps {
  goal?: Goal
  onClose: () => void
}

export function GoalForm({ goal, onClose }: GoalFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(goal?.name ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [targetAmount, setTargetAmount] = useState(goal?.targetAmount ? String(goal.targetAmount) : '')
  const [currentAmount, setCurrentAmount] = useState(goal?.currentAmount ? String(goal.currentAmount) : '')
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0])
  const [deadline, setDeadline] = useState(
    goal?.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : '',
  )

  const isValid = name.trim().length > 0 && parseNumber(targetAmount) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const now = new Date()
    const data: Omit<Goal, 'id'> = {
      name: name.trim(),
      description: description.trim() || undefined,
      targetAmount: parseNumber(targetAmount),
      currentAmount: parseNumber(currentAmount),
      deadline: deadline ? new Date(deadline) : undefined,
      color,
      createdAt: goal?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      if (goal?.id) {
        await updateGoal(goal.id, data)
      } else {
        await addGoal(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da meta"
        placeholder="Ex: Reserva de emergência"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <Textarea
        label="Descrição"
        placeholder="Detalhes da sua meta..."
        value={description}
        onChange={e => setDescription(e.target.value)}
        rows={2}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor alvo"
          type="number"
          step="0.01"
          placeholder="10.000,00"
          value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
          prefix={<span className="text-xs font-medium">R$</span>}
        />
        <Input
          label="Valor atual"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={currentAmount}
          onChange={e => setCurrentAmount(e.target.value)}
          prefix={<span className="text-xs font-medium">R$</span>}
        />
      </div>
      <Input
        label="Prazo (opcional)"
        type="date"
        value={deadline}
        onChange={e => setDeadline(e.target.value)}
      />

      {/* Color picker */}
      <div>
        <label className="text-sm font-medium text-text-primary block mb-2">Cor</label>
        <div className="flex gap-2 flex-wrap">
          {GOAL_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cn(
                'w-7 h-7 rounded-full transition-transform',
                color === c ? 'ring-2 ring-offset-2 ring-offset-surface-0 scale-110' : 'hover:scale-105',
              )}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          {goal ? 'Salvar' : 'Criar meta'}
        </Button>
      </div>
    </form>
  )
}
