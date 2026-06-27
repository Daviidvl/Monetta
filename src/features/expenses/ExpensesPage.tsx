import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Wallet, UtensilsCrossed, Car, Heart,
  ShoppingBag, Clapperboard, MoreHorizontal, Trash2,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { useMonthlyDebitExpenses } from '../../hooks/useData'
import { addDebitExpense, deleteDebitExpense } from '../../database/queries'
import { formatCurrency, parseNumber } from '../../utils/format'
import type { DebitExpense, ExpenseCategory } from '../../types'
import { EXPENSE_CATEGORY_LABELS } from '../../types'

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES: { id: ExpenseCategory; icon: React.ReactNode; color: string }[] = [
  { id: 'food',          icon: <UtensilsCrossed size={18} />, color: 'text-orange-500 bg-orange-500/12' },
  { id: 'transport',     icon: <Car size={18} />,             color: 'text-blue-500 bg-blue-500/12' },
  { id: 'health',        icon: <Heart size={18} />,           color: 'text-red-400 bg-red-400/12' },
  { id: 'shopping',      icon: <ShoppingBag size={18} />,     color: 'text-purple-500 bg-purple-500/12' },
  { id: 'entertainment', icon: <Clapperboard size={18} />,    color: 'text-green-500 bg-green-500/12' },
  { id: 'other',         icon: <MoreHorizontal size={18} />,  color: 'text-text-muted bg-surface-100' },
]

function getCat(id: ExpenseCategory) {
  return CATEGORIES.find(c => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
}

// ─── Day helpers ─────────────────────────────────────────────────────────────
function dayLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Hoje'
  if (date.toDateString() === yesterday.toDateString()) return 'Ontem'
  return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
}

function groupByDay(expenses: DebitExpense[]) {
  const map = new Map<string, DebitExpense[]>()
  for (const e of expenses) {
    const key = new Date(e.date).toDateString()
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries()).map(([dateStr, items]) => ({
    date: new Date(dateStr),
    items,
    dayTotal: items.reduce((s, e) => s + e.amount, 0),
  }))
}

// ─── Quick-add form ──────────────────────────────────────────────────────────
function ExpenseForm({ onClose }: { onClose: () => void }) {
  const [amount, setAmount]           = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory]       = useState<ExpenseCategory>('food')
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving]           = useState(false)

  async function handleSubmit() {
    const val = parseNumber(amount)
    if (!val || val <= 0) return
    setSaving(true)
    await addDebitExpense({
      description: description.trim(),
      amount: val,
      category,
      date: new Date(`${date}T12:00:00`),
      createdAt: new Date(),
    })
    onClose()
  }

  return (
    <div className="space-y-4 pt-1">
      <Input
        label="Valor"
        prefix="R$"
        type="number"
        inputMode="decimal"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="0,00"
      />

      <Input
        label="Descrição (opcional)"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Ex: Supermercado, Uber, Farmácia…"
      />

      <div>
        <p className="text-sm font-medium text-text-secondary mb-2">Categoria</p>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                category === cat.id
                  ? 'border-accent-500 bg-accent-500/8'
                  : 'border-transparent bg-surface-50 hover:bg-surface-100'
              }`}
            >
              <span className={category === cat.id ? 'text-accent-500' : 'text-text-muted'}>
                {cat.icon}
              </span>
              <span className={`text-[11px] font-medium text-center leading-tight ${
                category === cat.id ? 'text-accent-500' : 'text-text-muted'
              }`}>
                {EXPENSE_CATEGORY_LABELS[cat.id]}
              </span>
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Data"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />

      <Button fullWidth onClick={handleSubmit} loading={saving}>
        Registrar gasto
      </Button>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export function ExpensesPage() {
  const expenses = useMonthlyDebitExpenses()
  const [addOpen, setAddOpen]           = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DebitExpense | null>(null)

  const totalThisMonth = expenses.reduce((s, e) => s + e.amount, 0)
  const groups         = groupByDay(expenses)

  const now = new Date()
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long' })

  return (
    <div className="px-4 pt-6 pb-28 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader
        title="Gastos"
        subtitle={`${expenses.length} lançamento${expenses.length !== 1 ? 's' : ''} em ${monthName}`}
      />

      {/* Summary card */}
      {totalThisMonth > 0 && (
        <div className="mb-5 rounded-2xl bg-status-danger p-5 shadow-lg shadow-status-danger/20">
          <p className="text-xs text-white/70 mb-1">Gasto no débito em {monthName}</p>
          <p className="text-3xl font-bold text-white tracking-tight">{formatCurrency(totalThisMonth)}</p>
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <Card>
          <EmptyState
            icon={<Wallet size={20} />}
            title="Nenhum gasto registrado"
            description="Registre compras no débito ou saídas de dinheiro para ver o histórico do mês."
            action={
              <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                Registrar primeiro gasto
              </Button>
            }
          />
        </Card>
      )}

      {/* List grouped by day */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {groups.map(({ date, items, dayTotal }) => (
            <motion.div
              key={date.toDateString()}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-text-muted capitalize">{dayLabel(date)}</p>
                <p className="text-xs text-text-muted">{formatCurrency(dayTotal)}</p>
              </div>

              <Card padded={false}>
                {items.map((expense, i) => {
                  const cat = getCat(expense.category)
                  return (
                    <div
                      key={expense.id}
                      className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border-subtle' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                        {cat.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">
                          {expense.description || EXPENSE_CATEGORY_LABELS[expense.category]}
                        </p>
                        {expense.description && (
                          <p className="text-xs text-text-muted">{EXPENSE_CATEGORY_LABELS[expense.category]}</p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-status-danger flex-shrink-0">
                        -{formatCurrency(expense.amount)}
                      </p>
                      <button
                        onClick={() => setDeleteTarget(expense)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:bg-status-danger/8 hover:text-status-danger transition-colors flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )
                })}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-accent-500 text-white shadow-xl shadow-accent-500/30 flex items-center justify-center hover:bg-accent-500/90 active:scale-95 transition-all z-30"
      >
        <Plus size={24} />
      </button>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Registrar gasto"
        description="Compra no débito, dinheiro ou Pix."
      >
        <ExpenseForm onClose={() => setAddOpen(false)} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteDebitExpense(deleteTarget!.id!); setDeleteTarget(null) }}
        title="Excluir gasto"
        description={`Excluir "${deleteTarget?.description || EXPENSE_CATEGORY_LABELS[deleteTarget?.category ?? 'other']}"?`}
        confirmLabel="Excluir"
      />
    </div>
  )
}
