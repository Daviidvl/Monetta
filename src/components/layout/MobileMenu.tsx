import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Download, Moon, Sun } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAppStore } from '../../store/useAppStore'
import { useAuthStore } from '../../store/useAuthStore'

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  onBackup: () => void
}

export function MobileMenu({ open, onClose, onBackup }: MobileMenuProps) {
  const { theme, toggleTheme } = useAppStore()
  const user = useAuthStore(s => s.user)

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 bottom-0 z-10 w-72 max-w-[80vw] bg-surface-0 shadow-elevated flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
          >
            <div className="flex items-center justify-between px-5 py-5 border-b border-border-subtle">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary font-heading">Menu</p>
                {user?.email && (
                  <p className="text-xs text-text-muted mt-0.5 truncate">{user.email}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="ml-3 p-1.5 rounded-xl hover:bg-surface-100 text-text-muted transition-colors flex-shrink-0"
                aria-label="Fechar menu"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 px-3 py-3 space-y-0.5">
              <NavLink
                to="/perfil"
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 h-11 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'text-accent-500 bg-accent-500/8'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-100',
                  )
                }
              >
                <User size={17} strokeWidth={1.5} />
                Perfil
              </NavLink>
              <button
                onClick={() => { onBackup(); onClose() }}
                className="flex items-center gap-3 px-3 h-11 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                <Download size={17} strokeWidth={1.5} />
                Backup
              </button>
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-3 h-11 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
              >
                {theme === 'light' ? <Moon size={17} strokeWidth={1.5} /> : <Sun size={17} strokeWidth={1.5} />}
                {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
              </button>
            </nav>

            <div className="safe-bottom" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
