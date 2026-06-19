import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconEnd?: React.ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm shadow-accent-500/20',
  secondary:
    'bg-surface-100 text-text-primary hover:bg-surface-200 dark:bg-surface-100 dark:hover:bg-surface-200',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-100 hover:text-text-primary',
  danger:
    'bg-status-danger/10 text-status-danger hover:bg-status-danger/20',
  outline:
    'border border-border-base bg-transparent text-text-primary hover:bg-surface-50',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-9 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-11 px-5 text-sm gap-2 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', loading, icon, iconEnd, fullWidth, className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150',
          'active:scale-[0.97]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-accent-500 focus-visible:outline-offset-2',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        ) : (
          icon
        )}
        {children && <span>{children}</span>}
        {!loading && iconEnd}
      </button>
    )
  },
)

Button.displayName = 'Button'
