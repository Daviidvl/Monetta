import { Link } from 'react-router-dom'
import { Modal } from '../ui/Modal'
import { QUICK_ACTIONS } from '../../utils/quickActions'

interface QuickAddMenuProps {
  open: boolean
  onClose: () => void
}

export function QuickAddMenu({ open, onClose }: QuickAddMenuProps) {
  return (
    <Modal open={open} onClose={onClose} title="Adicionar" size="sm">
      <div className="grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map(({ label, icon: Icon, to }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-50 hover:bg-accent-500/8 transition-colors text-center"
          >
            <span className="w-11 h-11 rounded-2xl bg-accent-500/10 flex items-center justify-center text-accent-500">
              <Icon size={20} strokeWidth={1.75} />
            </span>
            <span className="text-xs font-medium text-text-primary">{label}</span>
          </Link>
        ))}
      </div>
    </Modal>
  )
}
