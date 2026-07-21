import { motion } from 'framer-motion'

const COLORS = {
  danger: '#FF5B6A',
  warning: '#FFA534',
  success: '#46D889',
  accent: '#7A2FFF',
}

interface BudgetRingProps {
  income: number
  expenses: number
  invested: number
}

export function BudgetRing({ income, expenses, invested }: BudgetRingProps) {
  const usedPct = income > 0 ? Math.min(100, (expenses / income) * 100) : 0
  const invPct  = income > 0 ? Math.min(100 - usedPct, (invested / income) * 100) : 0

  const r = 52
  const circ = 2 * Math.PI * r
  const gap = 2

  // Arc segments (clockwise from top)
  const expArc  = (usedPct / 100) * circ - gap
  const invArc  = (invPct  / 100) * circ - gap
  const expOffset = 0
  const invOffset = -((usedPct / 100) * circ)

  const color = usedPct > 90 ? COLORS.danger : usedPct > 70 ? COLORS.warning : COLORS.success

  return (
    <div className="flex flex-col items-center">
      {/* Ring */}
      <div className="relative">
        <svg viewBox="0 0 120 120" className="w-28 h-28 -rotate-90">
          {/* Track */}
          <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-200)" strokeWidth="10" />
          {/* Expenses arc */}
          {expArc > 0 && (
            <motion.circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeDasharray={`${expArc} ${circ}`}
              strokeDashoffset={expOffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${expArc} ${circ}` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
          {/* Investments arc */}
          {invArc > 0 && (
            <motion.circle
              cx="60" cy="60" r={r}
              fill="none"
              stroke={COLORS.accent}
              strokeWidth="10"
              strokeDasharray={`${invArc} ${circ}`}
              strokeDashoffset={invOffset}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${invArc} ${circ}` }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            />
          )}
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center rotate-0">
          <span className="text-xl font-bold text-text-primary">{Math.round(usedPct)}%</span>
          <span className="text-[9px] text-text-muted leading-none">do orçamento</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[10px] text-text-muted">Despesas</span>
        </div>
        {invested > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-500" />
            <span className="text-[10px] text-text-muted">Investido</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-surface-300" />
          <span className="text-[10px] text-text-muted">Livre</span>
        </div>
      </div>
    </div>
  )
}
