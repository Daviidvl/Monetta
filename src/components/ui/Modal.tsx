import { useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useScrollLock } from '../../hooks/useScrollLock'
import { useIsDesktop } from '../../hooks/useMediaQuery'

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
  const isDesktop = useIsDesktop()
  const dragControls = useDragControls()

  useScrollLock(open)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 110 || info.velocity.y > 550) onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            className="fixed inset-0 bg-black/45 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className={cn(
              'relative z-10 w-full bg-surface-0 shadow-elevated flex flex-col max-h-[92dvh]',
              'rounded-t-3xl sm:rounded-3xl',
              sizes[size],
            )}
            initial={isDesktop ? { opacity: 0, scale: 0.96, y: 12 } : { y: '100%' }}
            animate={isDesktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={isDesktop
              ? { opacity: 0, scale: 0.97, y: 8, transition: { duration: 0.15 } }
              : { y: '100%', transition: { type: 'tween', duration: 0.22, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', damping: 32, stiffness: 380 }}
            drag={isDesktop ? false : 'y'}
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
          >
            {/* Grab area (mobile) — handle + header drag the sheet down to close.
                Content stays scrollable since dragging only starts from here. */}
            <div
              className="flex-shrink-0 sm:cursor-auto touch-none sm:touch-auto"
              onPointerDown={e => { if (!isDesktop) dragControls.start(e) }}
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-surface-300" />
              </div>

              {(title || description) && (
                <div className="flex items-start justify-between p-5 pb-0">
                  <div>
                    {title && <h2 className="text-base font-semibold text-text-primary font-heading">{title}</h2>}
                    {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
                  </div>
                  <button
                    onClick={onClose}
                    onPointerDown={e => e.stopPropagation()}
                    className="ml-4 p-1.5 rounded-xl hover:bg-surface-100 text-text-muted transition-colors"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto overscroll-contain">
              {/* Own presence context: a layoutId highlight mid-animation in
                  the content (e.g. SegmentedControl) would otherwise keep the
                  closed modal mounted and invisible, blocking all clicks. */}
              <AnimatePresence initial={false}>
                <div key="content">{children}</div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            {footer && (
              <div className="px-5 pb-5 pt-0 flex gap-3 flex-shrink-0">
                {footer}
              </div>
            )}

            {/* Safe area bottom (mobile) */}
            <div className="safe-bottom flex-shrink-0" />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
