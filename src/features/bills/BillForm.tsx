import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import { DaySelect } from '../../components/ui/DaySelect'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import type { Bill, BillCategory, Priority } from '../../types'
import { parseNumber } from '../../utils/format'
import { BILL_CATEGORY_OPTIONS, PRIORITY_OPTIONS } from '../../utils/categoryVisuals'
import { addBill, updateBill } from '../../database/queries'

interface BillFormProps {
  bill?: Bill
  onClose: () => void
}

export function BillForm({ bill, onClose }: BillFormProps) {
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(bill?.name ?? '')
  const [category, setCategory] = useState<BillCategory>(bill?.category ?? 'other')
  const [amount, setAmount] = useState(bill?.amount ? String(bill.amount) : '')
  // Legacy "Data específica" (dueDay 0) was never handled anywhere — fall back to day 1.
  const [dueDay, setDueDay] = useState(String(bill?.dueDay || 1))
  const [priority, setPriority] = useState<Priority>(bill?.priority ?? 'medium')
  const [isRecurring, setIsRecurring] = useState(bill?.isRecurring ?? true)
  const [isInstallment, setIsInstallment] = useState(bill?.isInstallment ?? false)
  const [installmentTotal, setInstallmentTotal] = useState(String(bill?.installmentTotal ?? ''))
  const [installmentPaid, setInstallmentPaid] = useState(String(bill?.installmentPaid ?? ''))
  const [notes, setNotes] = useState(bill?.notes ?? '')

  const isValid = name.trim().length > 0 && parseNumber(amount) > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const now = new Date()
    const data: Omit<Bill, 'id'> = {
      name: name.trim(),
      category,
      amount: parseNumber(amount),
      dueDay: parseInt(dueDay),
      priority,
      isRecurring,
      isInstallment,
      installmentTotal: isInstallment ? parseInt(installmentTotal) || undefined : undefined,
      installmentPaid: isInstallment ? parseInt(installmentPaid) || 0 : undefined,
      notes: notes.trim() || undefined,
      status: 'pending',
      createdAt: bill?.createdAt ?? now,
      updatedAt: now,
    }
    try {
      if (bill?.id) {
        await updateBill(bill.id, data)
      } else {
        await addBill(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Nome da conta"
        placeholder="Ex: Aluguel, Netflix, Parcela do carro..."
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />

      <Select
        label="Categoria"
        value={category}
        onChange={setCategory}
        options={BILL_CATEGORY_OPTIONS}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor"
          placeholder="0,00"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          prefix={<span className="text-xs font-medium">R$</span>}
        />
        <DaySelect
          label="Vencimento"
          value={parseInt(dueDay)}
          onChange={d => setDueDay(String(d))}
        />
      </div>

      <SegmentedControl
        label="Prioridade"
        value={priority}
        onChange={setPriority}
        options={PRIORITY_OPTIONS}
      />

      <div className="space-y-3 pt-1">
        <Toggle
          checked={isRecurring}
          onChange={setIsRecurring}
          label="Conta recorrente (mensal)"
        />
        <Toggle
          checked={isInstallment}
          onChange={v => { setIsInstallment(v); if (v) setIsRecurring(false) }}
          label="É parcelado"
          description="Dívidas e compras parceladas — o app acompanha quanto falta quitar."
        />
      </div>

      {isInstallment && (
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Total de parcelas"
            placeholder="12"
            type="number"
            value={installmentTotal}
            onChange={e => setInstallmentTotal(e.target.value)}
          />
          <Input
            label="Parcelas pagas"
            placeholder="0"
            type="number"
            value={installmentPaid}
            onChange={e => setInstallmentPaid(e.target.value)}
          />
        </div>
      )}

      <Textarea
        label="Observações"
        placeholder="Informações extras..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          {bill ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
