import { useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { useIsDesktop } from '../../hooks/useMediaQuery'
import { useScrollLock } from '../../hooks/useScrollLock'

interface PickerSurfaceProps {
  open: boolean
  onClose: () => void
  /** The trigger — the desktop popover anchors to it. */
  anchorRef: React.RefObject<HTMLElement>
  title?: string
  /** Desktop popover min width (defaults to the trigger width, at least 240px). */
  minWidth?: number
  children: React.ReactNode
}

interface Placement { top: number; left: number; width: number; maxHeight: number; origin: 'top' | 'bottom' }

const GAP = 6
const MAX_POPOVER_HEIGHT = 320

function computePlacement(anchor: HTMLElement, minWidth: number): Placement {
  const r = anchor.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const width = Math.min(Math.max(r.width, minWidth), vw - 16)
  const left = Math.min(Math.max(8, r.left), vw - width - 8)
  const below = vh - r.bottom - GAP - 8
  const above = r.top - GAP - 8
  const openUp = below < Math.min(MAX_POPOVER_HEIGHT, 220) && above > below
  const maxHeight = Math.min(MAX_POPOVER_HEIGHT, openUp ? above : below)
  return {
    top: openUp ? r.top - GAP - maxHeight : r.bottom + GAP,
    left,
    width,
    maxHeight,
    origin: openUp ? 'bottom' : 'top',
  }
}

// Picker content uses layoutId highlights (selected row / selected day). If one
// is mid layout-animation when the picker closes, framer-motion never calls
// safeToRemove and the invisible surface stays mounted, blocking every click.
// A nested AnimatePresence gives the content its own "present" context, so
// only the surface's own exit animation gates the unmount.
function Isolated({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      <div key="content">{children}</div>
    </AnimatePresence>
  )
}

/**
 * Shared shell for every custom picker (Select, DaySelect): a draggable bottom
 * sheet on phones and a popover anchored to the field on desktop. Rendered in
 * a portal so it escapes the transformed Modal panels it usually lives in.
 */
export function PickerSurface({ open, onClose, anchorRef, title, minWidth = 240, children }: PickerSurfaceProps) {
  const isDesktop = useIsDesktop()
  const dragControls = useDragControls()
  const [placement, setPlacement] = useState<Placement | null>(null)

  useScrollLock(open && !isDesktop)

  // Escape closes only the picker, not the Modal it sits in (capture phase
  // runs before the Modal's window listener, and we stop it there).
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  useLayoutEffect(() => {
    if (!open || !isDesktop || !anchorRef.current) return
    const update = () => anchorRef.current && setPlacement(computePlacement(anchorRef.current, minWidth))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, isDesktop, anchorRef, minWidth])

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.y > 90 || info.velocity.y > 500) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (isDesktop ? (
        placement && (
          <div key="popover" className="fixed inset-0 z-[70]" onMouseDown={onClose}>
            <motion.div
              role="dialog"
              aria-label={title}
              onMouseDown={e => e.stopPropagation()}
              className="fixed flex flex-col bg-surface-0 border border-border-base rounded-2xl shadow-elevated overflow-hidden"
              style={{
                top: placement.top,
                left: placement.left,
                width: placement.width,
                maxHeight: placement.maxHeight,
                transformOrigin: placement.origin === 'top' ? 'top center' : 'bottom center',
              }}
              initial={{ opacity: 0, scale: 0.96, y: placement.origin === 'top' ? -6 : 6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: placement.origin === 'top' ? -4 : 4, transition: { duration: 0.12 } }}
              transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            >
              <div className="overflow-y-auto overscroll-contain p-1.5"><Isolated>{children}</Isolated></div>
            </motion.div>
          </div>
        )
      ) : (
        <div key="sheet" className="fixed inset-0 z-[70] flex items-end justify-center">
          <motion.div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-label={title}
            className="relative w-full max-h-[78dvh] flex flex-col bg-surface-0 rounded-t-3xl shadow-elevated"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%', transition: { type: 'tween', duration: 0.2, ease: [0.4, 0, 1, 1] } }}
            transition={{ type: 'spring', damping: 34, stiffness: 420 }}
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={handleDragEnd}
          >
            {/* Grab area — handle + title drag the sheet down to dismiss */}
            <div
              className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing"
              onPointerDown={e => dragControls.start(e)}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-surface-300" />
              </div>
              {title && (
                <div className="flex items-center justify-between px-5 pt-1 pb-3">
                  <h3 className="text-base font-semibold text-text-primary font-heading">{title}</h3>
                  <button
                    type="button"
                    onClick={onClose}
                    onPointerDown={e => e.stopPropagation()}
                    className="w-8 h-8 -mr-1.5 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
                    aria-label="Fechar"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="overflow-y-auto overscroll-contain px-3 pb-3"><Isolated>{children}</Isolated></div>
            <div className="safe-bottom flex-shrink-0" />
          </motion.div>
        </div>
      ))}
    </AnimatePresence>,
    document.body,
  )
}
