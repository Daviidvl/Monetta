import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className={cn('flex items-center gap-3 cursor-pointer', disabled && 'opacity-50 cursor-not-allowed')}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent-500',
          checked ? 'bg-accent-500' : 'bg-surface-300',
        )}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-xs"
          animate={{ x: checked ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </button>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  )
}
