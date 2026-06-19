import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Receipt, TrendingUp, Target, CalendarDays } from 'lucide-react'
import { cn } from '../../utils/cn'

const navItems = [
  { to: '/', label: 'Início', icon: LayoutDashboard, exact: true },
  { to: '/contas', label: 'Contas', icon: Receipt },
  { to: '/calendario', label: 'Calendário', icon: CalendarDays },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/metas', label: 'Metas', icon: Target },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface-0/95 backdrop-blur-xl border-t border-border-subtle safe-bottom lg:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'relative flex flex-col items-center gap-0.5 px-3 py-1.5 min-w-[52px]',
                'transition-colors duration-150 rounded-xl',
                isActive ? 'text-accent-500' : 'text-text-muted',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-accent-500/8 rounded-xl"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                <span className={cn('text-[10px] font-medium', isActive ? 'text-accent-500' : 'text-text-muted')}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
