import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import type { Investment, InvestmentType } from '../../types'
import { INVESTMENT_TYPE_LABELS } from '../../types'
import { parseNumber } from '../../utils/format'
import { addInvestment, updateInvestment } from '../../database/queries'

interface InvestmentFormProps {
  investment?: Investment
  onClose: () => void
}

const typeOptions = Object.entries(INVESTMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

export function InvestmentForm({ investment, onClose }: InvestmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(investment?.name ?? '')
  const [type, setType] = useState<InvestmentType>(investment?.type ?? 'savings')
  const [platform, setPlatform] = useState(investment?.platform ?? '')
  const [amount, setAmount] = useState(investment?.amount ? String(investment.amount) : '')
  const [date, setDate] = useState(
    investment?.date
      ? new Date(investment.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  )
  const [notes, setNotes] = useState(investment?.notes ?? '')

  const isValid = name.trim().length > 0 && parseNumber(amount) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const now = new Date()
    const data: Omit<Investment, 'id'> = {
      name: name.trim(),
      type,
      platform: platform.trim(),
      amount: parseNumber(amount),
      date: new Date(date),
      notes: notes.trim() || undefined,
      createdAt: investment?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      if (investment?.id) {
        await updateInvestment(investment.id, data)
      } else {
        await addInvestment(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome do investimento"
        placeholder="Ex: Tesouro IPCA+ 2029"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={type}
          onChange={e => setType(e.target.value as InvestmentType)}
          options={typeOptions}
        />
        <Input
          label="Plataforma"
          placeholder="Nubank, XP..."
          value={platform}
          onChange={e => setPlatform(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          prefix={<span className="text-xs font-medium">R$</span>}
        />
        <Input
          label="Data"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
      </div>
      <Textarea
        label="Observações"
        placeholder="Rentabilidade, detalhes..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          {investment ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
