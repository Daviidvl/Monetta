import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ open, onClose, title, description, children, size = 'md', footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative z-10 w-full bg-surface-0 shadow-elevated',
              'rounded-t-3xl sm:rounded-3xl',
              sizes[size],
            )}
            initial={{ y: '100%', opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
          >
            {/* Drag handle (mobile) */}
            <div className="flex justify-center pt-3 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-surface-300" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between p-5 pb-0">
                <div>
                  {title && <h2 className="text-base font-semibold text-text-primary">{title}</h2>}
                  {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
                </div>
                <button
                  onClick={onClose}
                  className="ml-4 p-1.5 rounded-xl hover:bg-surface-100 text-text-muted transition-colors"
                  aria-label="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="p-5 overflow-y-auto max-h-[80dvh]">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 pb-5 pt-0 flex gap-3">
                {footer}
              </div>
            )}

            {/* Safe area bottom (mobile) */}
            <div className="h-safe-bottom" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
