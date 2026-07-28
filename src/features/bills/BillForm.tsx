import { useMemo, useState } from 'react'
import { addMonths } from 'date-fns'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import { Toggle } from '../../components/ui/Toggle'
import type { Bill, BillCategory, Priority } from '../../types'
import { CATEGORY_LABELS, PRIORITY_LABELS } from '../../types'
import { parseNumber } from '../../utils/format'
import { MONTH_NAMES_PT } from '../../utils/date'
import { addBill, updateBill } from '../../database/queries'

interface BillFormProps {
  bill?: Bill
  onClose: () => void
}

const categoryOptions = Object.entries(CATEGORY_LABELS).map(([v, l]) => ({ value: v, label: l }))
const priorityOptions = Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))
const dayOptions = [
  { value: '0', label: 'Data específica' },
  ...Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Dia ${i + 1}` })),
]

export function BillForm({ bill, onClose }: BillFormProps) {
  const cycleOptions = useMemo(() => {
    const now = new Date()
    return Array.from({ length: 12 }, (_, i) => {
      const d = addMonths(now, i)
      const m = d.getMonth() + 1
      const y = d.getFullYear()
      return { value: `${y}-${m}`, label: i === 0 ? 'Este mês' : `${MONTH_NAMES_PT[m - 1]} ${y}` }
    })
  }, [])

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(bill?.name ?? '')
  const [category, setCategory] = useState<BillCategory>(bill?.category ?? 'other')
  const [amount, setAmount] = useState(bill?.amount ? String(bill.amount) : '')
  const [dueDay, setDueDay] = useState(String(bill?.dueDay ?? 1))
  const [cycle, setCycle] = useState(
    bill?.startMonth && bill?.startYear ? `${bill.startYear}-${bill.startMonth}` : cycleOptions[0].value,
  )
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
    const isCurrentCycle = cycle === cycleOptions[0].value
    const [cycleYear, cycleMonth] = cycle.split('-').map(Number)
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
      startMonth: isCurrentCycle ? undefined : cycleMonth,
      startYear: isCurrentCycle ? undefined : cycleYear,
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

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Categoria"
          value={category}
          onChange={e => setCategory(e.target.value as BillCategory)}
          options={categoryOptions}
        />
        <Select
          label="Prioridade"
          value={priority}
          onChange={e => setPriority(e.target.value as Priority)}
          options={priorityOptions}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Valor"
          placeholder="0,00"
          type="number"
          step="0.01"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          prefix={<span className="text-xs font-medium">R$</span>}
        />
        <Select
          label="Vencimento"
          value={dueDay}
          onChange={e => setDueDay(e.target.value)}
          options={dayOptions}
        />
      </div>

      <Select
        label="Começa em"
        value={cycle}
        onChange={e => setCycle(e.target.value)}
        options={cycleOptions}
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
