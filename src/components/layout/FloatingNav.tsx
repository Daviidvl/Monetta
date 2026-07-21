import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, Receipt, Wallet, TrendingUp, Target } from 'lucide-react'
import { cn } from '../../utils/cn'

const navItems = [
  { to: '/',              label: 'Início',        icon: LayoutDashboard, exact: true },
  { to: '/contas',        label: 'Contas',        icon: Receipt },
  { to: '/gastos',        label: 'Gastos',        icon: Wallet },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/metas',         label: 'Metas',         icon: Target },
]

export function FloatingNav() {
  return (
    <nav
      className="fixed bottom-5 left-0 right-0 z-40 flex justify-center pointer-events-none lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="relative pointer-events-auto flex items-center gap-0.5 bg-surface-0/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-elevated px-1.5 py-1.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} end={exact} className="outline-none">
            {({ isActive }) => (
              <motion.div
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 600, damping: 30 }}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl cursor-pointer select-none',
                  'transition-colors duration-150',
                  isActive ? 'text-accent-500' : 'text-text-muted hover:text-text-secondary',
                  isActive ? 'px-3 py-2' : 'w-11 h-11',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="floating-nav-bg"
                    className="absolute inset-0 rounded-xl bg-accent-500/10"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <div className="relative z-10 flex flex-col items-center gap-0.5">
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.6} />
                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, y: -4, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -4, height: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="text-[9px] font-semibold leading-none whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
