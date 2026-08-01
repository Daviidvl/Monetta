import { useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'

interface DebtClearedCelebrationProps {
  open: boolean
  onClose: () => void
  billName: string
  installments: number
}

const PARTICLE_COLORS = ['#7A2FFF', '#9255FF', '#B68CFF', '#46D889', '#D8C2FF']

interface Particle {
  id: number
  x: number
  y: number
  size: number
  rotate: number
  delay: number
  color: string
  shape: 'circle' | 'bar'
}

function makeParticles(seed: number): Particle[] {
  const count = 26
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (((i * 37 + seed) % 100) / 100) * 0.4
    const distance = 90 + ((i * 41 + seed) % 130)
    return {
      id: i,
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance + 50,
      size: 6 + ((i * 13 + seed) % 8),
      rotate: (i * 53 + seed) % 360,
      delay: (i % 7) * 0.03,
      color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
      shape: i % 3 === 0 ? 'bar' : 'circle',
    }
  })
}

export function DebtClearedCelebration({ open, onClose, billName, installments }: DebtClearedCelebrationProps) {
  const particles = useMemo(() => (open ? makeParticles(Math.floor(Date.now() % 1000)) : []), [open])

  useEffect(() => {
    if (!open) return
    const timer = setTimeout(onClose, 6500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Particle burst */}
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
            {particles.map((p) => (
              <motion.span
                key={p.id}
                className={`absolute ${p.shape === 'circle' ? 'rounded-full' : 'rounded-sm'}`}
                style={{
                  width: p.shape === 'circle' ? p.size : p.size * 0.5,
                  height: p.shape === 'circle' ? p.size : p.size * 1.8,
                  backgroundColor: p.color,
                }}
                initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 1, rotate: p.rotate }}
                transition={{ duration: 1.1, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
              />
            ))}
          </div>

          {/* Card */}
          <motion.div
            className="relative z-10 w-full max-w-xs bg-surface-0 rounded-3xl shadow-elevated p-8 text-center overflow-hidden"
            initial={{ opacity: 0, scale: 0.85, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 8 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          >
            <div className="absolute inset-0 bg-glow-radial opacity-60 pointer-events-none" />

            <div className="relative flex justify-center mb-5">
              <motion.span
                className="absolute w-20 h-20 rounded-full bg-accent-500/20"
                animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="relative w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow"
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 12, stiffness: 260, delay: 0.15 }}
              >
                <Check size={28} className="text-white" strokeWidth={3} />
              </motion.div>
            </div>

            <h2 className="relative text-xl font-heading font-semibold text-text-primary">Dívida quitada!</h2>
            <p className="relative mt-1.5 text-sm text-text-muted">
              <span className="font-medium text-text-primary">{billName}</span> foi paga em todas as {installments} parcelas.
            </p>

            <button
              onClick={onClose}
              className="relative mt-6 h-12 w-full rounded-2xl bg-gradient-primary text-sm font-medium tracking-button text-white transition-all hover:brightness-[1.08] hover:shadow-glow active:scale-[0.98]"
            >
              Uhul!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
