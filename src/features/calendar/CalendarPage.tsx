import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { PageHeader } from '../../components/layout/PageHeader'
import { useBills, useProfile } from '../../hooks/useData'
import { formatCurrency } from '../../utils/format'
import { getDate, getMonth, getYear } from '../../utils/date'
import type { Bill } from '../../types'
import { PRIORITY_LABELS } from '../../types'

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function CalendarPage() {
  const now = new Date()
  const [viewYear, setViewYear] = useState(getYear(now))
  const [viewMonth, setViewMonth] = useState(getMonth(now))
  const [selectedDay, setSelectedDay] = useState<number | null>(getDate(now))

  const bills = useBills()
  const profile = useProfile()

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)
  const today = getDate(now)
  const isCurrentMonth = viewMonth === getMonth(now) && viewYear === getYear(now)

  // Build map: day -> bills
  const billsByDay = useMemo(() => {
    const map: Record<number, Bill[]> = {}
    for (const bill of bills) {
      if (!map[bill.dueDay]) map[bill.dueDay] = []
      map[bill.dueDay].push(bill)
    }
    return map
  }, [bills])

  // Payday
  const payDay = profile?.paymentDay

  const selectedBills = selectedDay ? (billsByDay[selectedDay] ?? []) : []
  const isPayday = selectedDay === payDay

  function prev() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(null)
  }
  function next() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(null)
  }

  const cells = Array.from({ length: firstDay + daysInMonth }, (_, i) => {
    if (i < firstDay) return null
    return i - firstDay + 1
  })

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader title="Calendário" subtitle="Seus vencimentos e recebimentos" />

      <Card>
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prev}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-sm font-semibold text-text-primary">
            {MONTHS[viewMonth]} {viewYear}
          </h2>
          <button
            onClick={next}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-text-muted py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />
            const hasBills = (billsByDay[day]?.length ?? 0) > 0
            const isSelected = selectedDay === day
            const isToday = isCurrentMonth && day === today
            const isPaydayCell = day === payDay
            const hasOverdue = billsByDay[day]?.some(b => b.status === 'overdue')
            const hasPaid = billsByDay[day]?.every(b => b.status === 'paid')

            return (
              <div key={day} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                  className={`
                    relative w-8 h-8 rounded-xl text-xs font-medium transition-all duration-150 flex items-center justify-center
                    ${isSelected ? 'bg-accent-500 text-white' : ''}
                    ${!isSelected && isToday ? 'bg-accent-500/10 text-accent-500 font-semibold' : ''}
                    ${!isSelected && !isToday ? 'text-text-primary hover:bg-surface-100' : ''}
                  `}
                >
                  {day}
                  {isPaydayCell && !isSelected && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-status-success" />
                  )}
                </button>
                {/* Dots */}
                {hasBills && (
                  <div className="flex gap-0.5">
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white/60' :
                        hasOverdue ? 'bg-status-danger' :
                        hasPaid ? 'bg-status-success' :
                        'bg-accent-500'
                      }`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border-subtle">
          {payDay && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <span className="w-2 h-2 rounded-full bg-status-success" />
              Pagamento (dia {payDay})
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            Vencimento
          </div>
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-status-danger" />
            Atrasado
          </div>
        </div>
      </Card>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mt-4"
          >
            <Card padded={false}>
              <div className="px-4 py-3 border-b border-border-subtle">
                <p className="text-sm font-semibold text-text-primary">
                  Dia {selectedDay}
                  {isPayday && (
                    <span className="ml-2 text-xs font-normal text-status-success">· Dia de recebimento</span>
                  )}
                </p>
              </div>

              {isPayday && (
                <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
                  <div className="w-8 h-8 rounded-xl bg-status-success/12 flex items-center justify-center">
                    <span className="text-status-success text-sm font-bold">$</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text-primary">Salário</p>
                    <p className="text-xs text-status-success">
                      {profile?.monthlyIncome ? formatCurrency(profile.monthlyIncome) : 'A definir'}
                    </p>
                  </div>
                </div>
              )}

              {selectedBills.length === 0 && !isPayday && (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-text-muted">Nenhum evento neste dia.</p>
                </div>
              )}

              {selectedBills.map(bill => (
                <div key={bill.id} className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle last:border-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                      bill.status === 'paid' ? 'bg-status-success/12 text-status-success' :
                      bill.status === 'overdue' ? 'bg-status-danger/12 text-status-danger' :
                      'bg-accent-500/12 text-accent-500'
                    }`}
                  >
                    {bill.status === 'paid' ? '✓' : bill.status === 'overdue' ? '!' : '·'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{bill.name}</p>
                    <p className="text-xs text-text-muted">{PRIORITY_LABELS[bill.priority]} prioridade</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-text-primary">{formatCurrency(bill.amount)}</p>
                    {bill.isInstallment && (
                      <p className="text-xs text-text-muted">
                        {bill.installmentPaid ?? 0}/{bill.installmentTotal}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
