import { useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { PickerSurface } from './PickerSurface'
import { DayPicker } from './DayPicker'

interface DaySelectProps {
  label?: string
  value: number
  onChange: (day: number) => void
  /** Short prefix for the field text — "Todo dia 5" by default. */
  prefix?: string
}

// Compact field for forms (Contas, Perfil): shows "Todo dia 5" and opens the
// 1–31 grid in a sheet/popover, instead of a 31-row native select.
export function DaySelect({ label, value, onChange, prefix = 'Todo dia' }: DaySelectProps) {
  const id = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()
  const [open, setOpen] = useState(false)
  const hasValue = value >= 1 && value <= 31

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function pick(day: number) {
    onChange(day)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {label && <label htmlFor={id} className="text-sm font-medium text-text-primary">{label}</label>}
      <motion.button
        ref={triggerRef}
        id={id}
        type="button"
        whileTap={{ scale: 0.985 }}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'w-full h-12 flex items-center gap-2.5 pl-1.5 pr-2.5 rounded-[14px] border bg-surface-0 text-left outline-none',
          'transition-[border-color,box-shadow] duration-150',
          open
            ? 'border-accent-500 shadow-[0_0_0_4px_rgba(122,47,255,.15)]'
            : 'border-border-base hover:border-border-strong focus-visible:border-accent-500 focus-visible:shadow-[0_0_0_4px_rgba(122,47,255,.15)]',
        )}
      >
        <span className="w-9 h-9 rounded-[10px] bg-accent-500/10 text-accent-500 flex flex-col items-center justify-center flex-shrink-0 leading-none">
          {hasValue ? (
            <>
              <span className="text-[8px] font-semibold uppercase tracking-wide opacity-70">dia</span>
              <span className="text-sm font-bold tabular-nums">{value}</span>
            </>
          ) : (
            <CalendarDays size={15} />
          )}
        </span>
        <span className={cn('flex-1 min-w-0 truncate text-sm', hasValue ? 'font-medium text-text-primary' : 'text-text-muted')}>
          {hasValue ? `${prefix} ${value}` : 'Escolha o dia'}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            open ? 'bg-accent-500 text-white' : 'bg-accent-500/10 text-accent-500',
          )}
        >
          <ChevronDown size={14} strokeWidth={2.4} />
        </motion.span>
      </motion.button>

      <PickerSurface open={open} onClose={() => setOpen(false)} anchorRef={triggerRef} title={label ?? 'Escolha o dia'} minWidth={300}>
        <div className="p-1">
          <DayPicker value={hasValue ? value : 0} onChange={pick} />
        </div>
      </PickerSurface>
    </div>
  )
}
