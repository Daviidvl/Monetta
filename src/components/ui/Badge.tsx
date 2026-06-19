import { cn } from '../../utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'muted'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-surface-100 text-text-secondary',
  muted:    'bg-surface-100 text-text-muted',
  success:  'bg-status-success/12 text-status-success',
  warning:  'bg-status-warning/12 text-status-warning',
  danger:   'bg-status-danger/12 text-status-danger',
  info:     'bg-status-info/12 text-status-info',
  accent:   'bg-accent-500/12 text-accent-500',
}

const dotColors: Record<BadgeVariant, string> = {
  default:  'bg-text-muted',
  muted:    'bg-text-muted',
  success:  'bg-status-success',
  warning:  'bg-status-warning',
  danger:   'bg-status-danger',
  info:     'bg-status-info',
  accent:   'bg-accent-500',
}

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}
