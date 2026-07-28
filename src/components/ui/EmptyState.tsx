import { forwardRef } from 'react'
import { cn } from '../../utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  function EmptyState({ icon, title, description, action, className }, ref) {
    return (
      <div ref={ref} className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
        {icon && (
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center text-text-muted mb-4">
            {icon}
          </div>
        )}
        <p className="text-sm font-medium text-text-primary">{title}</p>
        {description && <p className="mt-1 text-xs text-text-muted max-w-[240px]">{description}</p>}
        {action && <div className="mt-4">{action}</div>}
      </div>
    )
  },
)
