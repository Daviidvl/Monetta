import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useToastStore } from '../../store/useToastStore'
import { Button } from './Button'

export function ToastViewport() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col-reverse gap-2 w-[calc(100%-2rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="flex items-center gap-3 bg-surface-0 rounded-3xl shadow-elevated px-4 py-3"
          >
            <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
            {toast.onUndo && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  toast.onUndo?.()
                  dismiss(toast.id)
                }}
              >
                Desfazer
              </Button>
            )}
            <button
              onClick={() => dismiss(toast.id)}
              className="p-1 rounded-lg hover:bg-surface-100 text-text-muted transition-colors"
              aria-label="Fechar"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
