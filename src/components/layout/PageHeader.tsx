import { cn } from '../../utils/cn'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-xl font-semibold text-text-primary tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}
