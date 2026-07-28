import { Menu } from 'lucide-react'

interface MobileTopBarProps {
  onMenuOpen: () => void
}

export function MobileTopBar({ onMenuOpen }: MobileTopBarProps) {
  return (
    <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-5 h-14 bg-surface-0/90 backdrop-blur-xl border-b border-border-subtle">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-accent-500 flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="none" className="w-3.5 h-3.5">
            <path d="M4 13L7.5 6.5L10 11L12.5 8L16 13" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold text-text-primary font-heading tracking-tight">Monetta</span>
      </div>
      <button
        onClick={onMenuOpen}
        className="p-2 -mr-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-100 transition-colors"
        aria-label="Abrir menu"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>
    </header>
  )
}
