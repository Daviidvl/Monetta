import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

// The whole row is the tap target (not just the 36px switch) — easier on phones.
export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.99 }}
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-3 text-left rounded-xl py-1 outline-none',
        'focus-visible:ring-2 focus-visible:ring-accent-500/40',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
      )}
    >
      <span
        className={cn(
          'relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200',
          checked ? 'bg-accent-500' : 'bg-surface-300',
        )}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)]"
          animate={{ x: checked ? 20 : 0 }}
          whileTap={{ width: 24 }}
          transition={{ type: 'spring', stiffness: 600, damping: 32 }}
        />
      </span>
      {(label || description) && (
        <span className="flex-1 min-w-0">
          {label && <span className="block text-sm text-text-primary">{label}</span>}
          {description && <span className="block text-xs text-text-muted mt-0.5">{description}</span>}
        </span>
      )}
    </motion.button>
  )
}
