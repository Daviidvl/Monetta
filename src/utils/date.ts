import { format, isToday, isTomorrow, addDays, getDate, getMonth, getYear } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, "dd 'de' MMMM", { locale: ptBR })
}

export function formatDateShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd/MM/yyyy')
}

export function formatMonth(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, 'MMMM yyyy', { locale: ptBR })
}

export function formatMonthShort(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  return format(date, "MMM 'yy", { locale: ptBR })
}

// Days between "today" and a bill's due date, resolved against the billing
// cycle it belongs to (activeMonth/activeYear) — not just the bare day number.
// A dueDay of 1 for a cycle that hasn't started in real time yet (cycle
// closed early, ahead of the calendar) must not be treated as overdue.
export function daysUntilDue(dueDay: number, cycleMonth: number, cycleYear: number): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dueDate = new Date(cycleYear, cycleMonth - 1, dueDay)
  return Math.round((dueDate.getTime() - today.getTime()) / 86_400_000)
}

export function dueDayLabel(dueDay: number, cycleMonth: number, cycleYear: number): string {
  const diff = daysUntilDue(dueDay, cycleMonth, cycleYear)

  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Vence hoje'
  if (diff === 1) return 'Vence amanhã'
  if (diff <= 7) return `Vence em ${diff} dias`
  return `Dia ${dueDay}`
}

export function currentMonthYear() {
  const now = new Date()
  return { month: getMonth(now) + 1, year: getYear(now) }
}

// Bills get planned a few days before the calendar month actually ends
// (payday lands on the 1st, but the user does their bill entry around the
// 28th) — the "active" cycle rolls to next month a few days early instead of
// waiting for midnight on the 1st, so bills entered that week land in the
// month they're meant for instead of showing "vencida"/scheduled-for-later.
export const CYCLE_START_DAY = 28

export function cycleMonthYear(reference: Date = new Date(), cycleStartDay = CYCLE_START_DAY): { month: number; year: number } {
  let month = reference.getMonth() + 1
  let year = reference.getFullYear()
  if (reference.getDate() >= cycleStartDay) {
    month += 1
    if (month > 12) { month = 1; year += 1 }
  }
  return { month, year }
}

// A bill created after its own due day already passed that month (e.g. added
// on the 28th with dueDay 5) has no business counting as overdue right away —
// its real first cycle is the month after creation. Derived purely from
// createdAt + dueDay, no extra field needed: once that first cycle arrives,
// this naturally returns null/false forever after.
export function scheduledCycle(createdAt: Date, dueDay: number): { month: number; year: number } | null {
  const createdMonth = createdAt.getMonth() + 1
  const createdYear = createdAt.getFullYear()
  if (createdAt.getDate() <= dueDay) return null

  let month = createdMonth + 1
  let year = createdYear
  if (month > 12) { month = 1; year += 1 }
  return { month, year }
}

export function isBillScheduled(
  createdAt: Date,
  dueDay: number,
  cycleMonth: number,
  cycleYear: number,
): boolean {
  const first = scheduledCycle(createdAt, dueDay)
  if (!first) return false
  return cycleYear < first.year || (cycleYear === first.year && cycleMonth < first.month)
}

export const MONTH_NAMES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export { isToday, isTomorrow, addDays, getDate, getMonth, getYear, format, ptBR }
