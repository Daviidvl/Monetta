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

export function dueDayLabel(dueDay: number): string {
  const today = new Date()
  const currentDay = getDate(today)
  const diff = dueDay - currentDay

  if (diff < 0) return 'Vencida'
  if (diff === 0) return 'Vence hoje'
  if (diff === 1) return 'Vence amanhã'
  if (diff <= 7) return `Vence em ${diff} dias`
  return `Dia ${dueDay}`
}

export function isDueSoon(dueDay: number, days = 7): boolean {
  const today = new Date()
  const currentDay = getDate(today)
  const diff = dueDay - currentDay
  return diff >= 0 && diff <= days
}

export function isOverdue(dueDay: number): boolean {
  const today = new Date()
  const currentDay = getDate(today)
  return dueDay < currentDay
}

export function getDaysUntilDue(dueDay: number): number {
  const today = new Date()
  return dueDay - getDate(today)
}

export function currentMonthYear() {
  const now = new Date()
  return { month: getMonth(now) + 1, year: getYear(now) }
}

export { isToday, isTomorrow, addDays, getDate, getMonth, getYear, format, ptBR }
