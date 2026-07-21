import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Search, Receipt, History, ChevronDown } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { BillCard } from './BillCard'
import { BillForm } from './BillForm'
import { useBills, useProfile } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import { getBillHistory, type BillHistoryEntry } from '../../database/queries'
import { useAppStore } from '../../store/useAppStore'
import type { Bill, Priority } from '../../types'

type Tab = 'all' | 'pending' | 'paid' | 'installments' | 'history'

const tabs: { id: Tab; label: string }[] = [
  { id: 'all',          label: 'Todas' },
  { id: 'pending',      label: 'Pendentes' },
  { id: 'paid',         label: 'Pagas' },
  { id: 'installments', label: 'Parceladas' },
  { id: 'history',      label: 'Histórico' },
]

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

// A finished installment plan (e.g. 10/10) has nothing left to track — it
// should drop out of the active bill views but still shows up in Pagas/Histórico.
function isFinishedInstallment(bill: Bill): boolean {
  return bill.isInstallment && (bill.installmentPaid ?? 0) >= (bill.installmentTotal ?? 1)
}

const listStagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}

const listItem = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } },
}

// ─── Collapsible month section — click the bar, list slides down ────────────
function MonthAccordion({ label, total, children }: { label: string; total: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-surface-100 hover:bg-surface-200 transition-colors"
      >
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-status-success">{formatCurrency(total)}</span>
          <ChevronDown
            size={14}
            className={`text-text-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <motion.div variants={listStagger} initial="hidden" animate="show" className="pt-2">
              {children}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Paid bills grouped by month ─────────────────────────────────────────────
function PaidByMonth({ bills }: { bills: Bill[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, Bill[]>()
    for (const bill of bills) {
      const m = bill.paidMonth ?? (bill.paidAt ? new Date(bill.paidAt).getMonth() + 1 : 0)
      const y = bill.paidYear  ?? (bill.paidAt ? new Date(bill.paidAt).getFullYear()  : 0)
      const key = m && y ? `${y}-${String(m).padStart(2, '0')}` : 'sem-data'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(bill)
    }
    return [...map.entries()].sort((a, b) => {
      if (a[0] === 'sem-data') return 1
      if (b[0] === 'sem-data') return -1
      return b[0].localeCompare(a[0])
    })
  }, [bills])

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={<Receipt size={20} />}
        title="Nenhuma conta paga ainda"
        description="Marque suas contas como pagas para vê-las aqui."
      />
    )
  }

  return (
    <div className="space-y-3">
      {grouped.map(([key, groupBills]) => {
        const [yearStr, monthStr] = key.split('-')
        const month    = parseInt(monthStr)
        const year     = parseInt(yearStr)
        const total    = groupBills.reduce((s, b) => s + b.amount, 0)
        const isKnown  = key !== 'sem-data' && !isNaN(month) && !isNaN(year)
        const label    = isKnown ? `Contas de ${MONTH_NAMES[month - 1]} ${year}` : 'Sem data'

        return (
          <MonthAccordion key={key} label={label} total={total}>
            <Card padded={false}>
              {groupBills.map(bill => (
                <motion.div key={bill.id} variants={listItem}>
                  <BillCard bill={bill} />
                </motion.div>
              ))}
            </Card>
          </MonthAccordion>
        )
      })}
    </div>
  )
}

// ─── History tab (payment records) ───────────────────────────────────────────
function HistoryTab() {
  const history = useLiveQuery(() => getBillHistory(), []) ?? []

  const grouped = useMemo(() => {
    const map = new Map<string, BillHistoryEntry[]>()
    for (const entry of history) {
      const key = `${entry.year}-${String(entry.month).padStart(2, '0')}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(entry)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [history])

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon={<History size={20} />}
        title="Sem histórico ainda"
        description="Ao marcar contas como pagas, elas aparecerão aqui organizadas por mês."
      />
    )
  }

  return (
    <div className="space-y-3">
      {grouped.map(([key, entries]) => {
        const [yearStr, monthStr] = key.split('-')
        const month = parseInt(monthStr)
        const year  = parseInt(yearStr)
        const total = entries.reduce((s, e) => s + e.amount, 0)
        const label = `Contas de ${MONTH_NAMES[month - 1]} ${year}`

        return (
          <MonthAccordion key={key} label={label} total={total}>
            <Card padded={false}>
              <div className="divide-y divide-border-subtle">
                {entries.map((entry, i) => (
                  <motion.div key={i} variants={listItem} className="flex items-center justify-between px-4 py-2.5">
                    <p className="text-sm text-text-primary">{entry.billName}</p>
                    <p className="text-sm font-medium text-text-secondary">{formatCurrency(entry.amount)}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </MonthAccordion>
        )
      })}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export function BillsPage() {
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as Tab) ?? 'all'

  const [activeTab, setActiveTab] = useState<Tab>(initialTab)
  const [search, setSearch]       = useState('')
  const [addOpen, setAddOpen]     = useState(searchParams.get('add') === '1')

  const bills = useBills()
  useProfile()

  // Finished installments (e.g. 10/10) are done — hide them from the active
  // bill views entirely, they only matter for Pagas/Histórico from here on.
  const activeBills = useMemo(() => bills.filter(b => !isFinishedInstallment(b)), [bills])

  // activeMonth/activeYear track the real calendar (synced by MonthlyResetGuard
  // in App.tsx) — bills marked paid stay visible in Pagas until the month
  // actually turns over, instead of resetting the moment everything is paid.
  const { activeMonth, activeYear } = useAppStore()

  const filtered = useMemo(() => {
    let list = [...activeBills]

    if (activeTab === 'pending')      list = list.filter(b => b.status !== 'paid')
    if (activeTab === 'paid')         list = list.filter(b => b.status === 'paid')
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
  }, [activeBills, activeTab, search])

  const totalPending = activeBills.filter(b => b.status !== 'paid').reduce((s, b) => s + b.amount, 0)
  const totalPaid    = activeBills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0)
  const paidBills    = useMemo(() => bills.filter(b => b.status === 'paid'), [bills])

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
          <p className="text-xs text-text-muted">Já pago este mês</p>
          <p className="text-lg font-semibold text-status-success mt-0.5">{formatCurrency(totalPaid)}</p>
        </Card>
      </div>

      {/* Tabs — scrollable on mobile */}
      <div className="flex gap-1 bg-surface-100 p-1 rounded-xl mb-4 overflow-x-auto no-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-150 ${
              activeTab === tab.id
                ? 'bg-surface-0 text-text-primary shadow-xs'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Paid tab: grouped by month */}
      {activeTab === 'paid' ? (
        <PaidByMonth bills={paidBills} />
      ) : activeTab === 'history' ? (
        <HistoryTab />
      ) : (
        <>
          {/* Active cycle title */}
          <p className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2 px-1">
            Contas de {MONTH_NAMES[activeMonth - 1]} {activeYear}
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conta..."
              className="w-full h-12 pl-8 pr-3 rounded-[14px] border border-border-base bg-surface-0 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:shadow-[0_0_0_4px_rgba(122,47,255,.15)] transition-all"
            />
          </div>

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
        </>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Nova conta" description="Adicione uma conta fixa ou parcelamento.">
        <BillForm onClose={() => setAddOpen(false)} />
      </Modal>
    </div>
  )
}
