import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import type { IncomeCategory, IncomeEntry } from '../../types'
import { INCOME_CATEGORY_LABELS } from '../../types'
import { parseNumber } from '../../utils/format'
import { addIncome, updateIncome } from '../../database/queries'
import { getMonth, getYear } from '../../utils/date'

interface IncomeFormProps {
  income?: IncomeEntry
  onClose: () => void
}

const categoryOptions = Object.entries(INCOME_CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))

export function IncomeForm({ income, onClose }: IncomeFormProps) {
  const [loading, setLoading] = useState(false)
  const now = new Date()

  const [name, setName] = useState(income?.name ?? '')
  const [category, setCategory] = useState<IncomeCategory>(income?.category ?? 'salary')
  const [amount, setAmount] = useState(income?.amount ? String(income.amount) : '')
  const [isRecurring, setIsRecurring] = useState(income?.isRecurring ?? false)
  const [notes, setNotes] = useState(income?.notes ?? '')

  const isValid = name.trim().length > 0 && parseNumber(amount) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const ts = new Date()
    const data: Omit<IncomeEntry, 'id'> = {
      name: name.trim(),
      category,
      amount: parseNumber(amount),
      month: getMonth(now) + 1,
      year: getYear(now),
      isRecurring,
      notes: notes.trim() || undefined,
      createdAt: income?.createdAt ?? ts,
      updatedAt: ts,
    }
    try {
      if (income?.id) {
        await updateIncome(income.id, data)
      } else {
        await addIncome(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Descrição"
        placeholder="Ex: Férias, Bônus, Freela..."
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <Select
        label="Tipo"
        value={category}
        onChange={e => setCategory(e.target.value as IncomeCategory)}
        options={categoryOptions}
      />
      <Input
        label="Valor"
        type="number"
        step="0.01"
        placeholder="0,00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        prefix={<span className="text-xs font-medium">R$</span>}
      />
      <Toggle
        checked={isRecurring}
        onChange={setIsRecurring}
        label="Repete todo mês"
      />
      <Textarea
        label="Observações"
        placeholder="Detalhes opcionais..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          {income ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
