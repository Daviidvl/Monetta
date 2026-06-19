import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
}

const sizeMap = { sm: 'h-1', md: 'h-1.5', lg: 'h-2' }

export function ProgressBar({ value, max = 100, color = '#635BFF', size = 'md', className, animated = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full rounded-full overflow-hidden bg-surface-200', sizeMap[size], className)}>
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={animated ? { width: '0%' } : { width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  )
}
