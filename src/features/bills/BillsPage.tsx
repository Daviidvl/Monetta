import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Plus, Search, Receipt } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { BillCard } from './BillCard'
import { BillForm } from './BillForm'
import { useBills, useProfile } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import type { Priority } from '../../types'

type Tab = 'all' | 'pending' | 'paid' | 'installments'

const tabs: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'pending', label: 'Pendentes' },
  { id: 'paid', label: 'Pagas' },
  { id: 'installments', label: 'Parceladas' },
]

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

export function BillsPage() {
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'all'

  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const bills = useBills()
  useProfile()

  const filtered = useMemo(() => {
    let list = [...bills]

    if (activeTab === 'pending') list = list.filter(b => b.status !== 'paid')
    if (activeTab === 'paid') list = list.filter(b => b.status === 'paid')
    if (activeTab === 'installments') list = list.filter(b => b.isInstallment)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(b => b.name.toLowerCase().includes(q))
    }

    return list.sort((a, b) => {
      if (a.status === 'paid' && b.status !== 'paid') return 1
      if (a.status !== 'paid' && b.status === 'paid') return -1
      if (a.status === 'overdue' && b.status !== 'overdue') return -1
      if (a.status !== 'overdue' && b.status === 'overdue') return 1
      const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (pDiff !== 0) return pDiff
      return a.dueDay - b.dueDay
    })
  }, [bills, activeTab, search])

  const totalPending = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0)
  const totalPaid = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0)

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader
        title="Contas"
        subtitle={`${bills.length} conta${bills.length !== 1 ? 's' : ''} cadastrada${bills.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Adicionar
          </Button>
        }
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card className="p-3">
          <p className="text-xs text-text-muted">A pagar</p>
          <p className="text-lg font-semibold text-text-primary mt-0.5">{formatCurrency(totalPending)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-text-muted">Já pago</p>
          <p className="text-lg font-semibold text-status-success mt-0.5">{formatCurrency(totalPaid)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-surface-0 text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar conta..."
          className="w-full h-9 pl-8 pr-3 rounded-xl border border-border-base bg-surface-0 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none transition-colors"
        />
      </div>

      {/* List */}
      <Card padded={false}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <EmptyState
              key="empty"
              icon={<Receipt size={20} />}
              title={search ? 'Nenhuma conta encontrada' : 'Nenhuma conta ainda'}
              description={search ? 'Tente outro termo de busca.' : 'Adicione suas contas fixas, parcelamentos e despesas.'}
              action={
                !search ? (
                  <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                    Adicionar primeira conta
                  </Button>
                ) : undefined
              }
            />
          ) : (
            filtered.map(bill => <BillCard key={bill.id} bill={bill} />)
          )}
        </AnimatePresence>
      </Card>

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova conta" description="Adicione uma conta fixa ou parcelamento.">
        <BillForm onClose={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
