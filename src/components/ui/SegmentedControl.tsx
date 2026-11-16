import { useId } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

export interface SegmentOption<T extends string> {
  value: T
  label: string
  /** Small colored dot before the label (e.g. priority levels). */
  dotColor?: string
}

interface SegmentedControlProps<T extends string> {
  label?: string
  value: T
  onChange: (value: T) => void
  options: SegmentOption<T>[]
}

// For 2–4 short choices: every option visible at once, one tap, no sheet.
export function SegmentedControl<T extends string>({ label, value, onChange, options }: SegmentedControlProps<T>) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      {label && <span id={`${id}-label`} className="text-sm font-medium text-text-primary">{label}</span>}
      <div
        role="radiogroup"
        aria-labelledby={label ? `${id}-label` : undefined}
        className="h-12 grid gap-1 p-1 rounded-[14px] bg-surface-100"
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map(opt => {
          const selected = opt.value === value
          return (
            <motion.button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative flex items-center justify-center gap-1.5 rounded-[10px] text-xs font-medium transition-colors min-w-0',
                selected ? 'text-text-primary' : 'text-text-muted hover:text-text-secondary',
              )}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-segment`}
                  className="absolute inset-0 rounded-[10px] bg-surface-0 shadow-card"
                  transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                />
              )}
              {opt.dotColor && (
                <span className="relative z-10 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: opt.dotColor }} />
              )}
              <span className="relative z-10 truncate">{opt.label}</span>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
