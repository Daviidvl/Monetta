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

export { isToday, isTomorrow, addDays, getDate, getMonth, getYear, format, ptBR }
