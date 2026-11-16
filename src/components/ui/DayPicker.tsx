import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface DayPickerProps {
  label?: string
  value: number
  onChange: (day: number) => void
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

// Tap-friendly 1–31 grid that replaces the native <select> on mobile:
// no OS picker sheet, no focus zoom, and the chosen day is visible at a glance.
export function DayPicker({ label, value, onChange }: DayPickerProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-text-primary">{label}</span>
          <span className="text-xs font-medium text-accent-500">Todo dia {value}</span>
        </div>
      )}
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-7 gap-1.5 p-2 rounded-2xl border border-border-base bg-surface-50"
      >
        {DAYS.map(day => {
          const selected = day === value
          return (
            <motion.button
              key={day}
              type="button"
              role="radio"
              aria-checked={selected}
              whileTap={{ scale: 0.88 }}
              onClick={() => onChange(day)}
              className={cn(
                'relative aspect-square rounded-xl text-sm font-medium tabular-nums select-none',
                'flex items-center justify-center transition-colors',
                selected ? 'text-white' : 'text-text-secondary hover:bg-surface-100',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-day`}
                  className="absolute inset-0 rounded-xl bg-gradient-primary shadow-glow"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                />
              )}
              <span className="relative z-10">{day}</span>
            </motion.button>
          )
        })}
      </div>
      {value > 28 && (
        <p className="text-xs text-text-muted">
          Em meses mais curtos, consideramos o último dia do mês.
        </p>
      )}
    </div>
  )
}
