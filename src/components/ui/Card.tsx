import { cn } from '../../utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
  padded?: boolean
}

export function Card({ hoverable, padded = true, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface-0 rounded-3xl shadow-card',
        hoverable && 'transition-shadow duration-200 cursor-pointer hover:shadow-card-hover',
        padded && 'p-6',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  action?: React.ReactNode
}

export function CardHeader({ action, className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      <div className="flex-1 min-w-0">{children}</div>
      {action && <div className="ml-3 flex-shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-medium text-text-secondary', className)} {...props}>
      {children}
    </h3>
  )
}
