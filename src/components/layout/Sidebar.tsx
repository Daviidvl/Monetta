import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  TrendingUp,
  Target,
  Moon,
  Sun,
  Download,
  Plus,
  User,
} from 'lucide-react'
import { cn } from '../../utils/cn'
import { useAppStore } from '../../store/useAppStore'

const navItems = [
  { to: '/',              label: 'Dashboard',    icon: LayoutDashboard, exact: true },
  { to: '/contas',        label: 'Contas',       icon: Receipt },
  { to: '/gastos',        label: 'Gastos',       icon: Wallet },
  { to: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { to: '/metas',         label: 'Metas',        icon: Target },
]

interface SidebarProps {
  onBackup?: () => void
  onQuickAdd?: () => void
}

export function Sidebar({ onBackup, onQuickAdd }: SidebarProps) {
  const { theme, toggleTheme } = useAppStore()

  return (
    <aside className="hidden lg:flex flex-col w-56 h-dvh sticky top-0 border-r border-border-subtle bg-surface-0 flex-shrink-0">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
              <path d="M4 13L7.5 6.5L10 11L12.5 8L16 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-text-primary font-heading tracking-tight">Monetta</span>
        </div>
      </div>

      {/* Quick add */}
      {onQuickAdd && (
        <div className="px-3 mb-3">
          <button
            onClick={onQuickAdd}
            className="flex items-center justify-center gap-2 h-10 w-full rounded-xl bg-gradient-primary text-white text-sm font-medium hover:-translate-y-0.5 hover:brightness-[1.08] hover:shadow-glow transition-all"
          >
            <Plus size={16} />
            Adicionar
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-2.5 px-3 h-9 rounded-xl text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-accent-500 bg-accent-500/8'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-100',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} strokeWidth={isActive ? 2 : 1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 space-y-0.5">
        <NavLink
          to="/perfil"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 h-9 w-full rounded-xl text-sm font-medium transition-colors',
              isActive
                ? 'text-accent-500 bg-accent-500/8'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-100',
            )
          }
        >
          <User size={16} strokeWidth={1.5} />
          Perfil
        </NavLink>
        {onBackup && (
          <button
            onClick={onBackup}
            className="flex items-center gap-2.5 px-3 h-9 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
          >
            <Download size={16} strokeWidth={1.5} />
            Backup
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2.5 px-3 h-9 w-full rounded-xl text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
        >
          {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
          {theme === 'light' ? 'Modo escuro' : 'Modo claro'}
        </button>
      </div>
    </aside>
  )
}
