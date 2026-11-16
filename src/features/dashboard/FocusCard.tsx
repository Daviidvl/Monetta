import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Flag, PartyPopper, ShieldCheck, Sparkles, TrendingUp, Plus } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { ProgressBar } from '../../components/ui/ProgressBar'
import { Button } from '../../components/ui/Button'
import { formatCurrency } from '../../utils/format'
import { formatMonths } from '../../utils/goals'
import { debtFreeLabel, type DebtSummary, type FocusMode, type ReserveStatus } from '../../utils/focusMode'
import { updateFinancialGoal } from '../../database/queries'

interface FocusCardProps {
  mode: FocusMode
  debt: DebtSummary
  /** User has registered at least one installment plan, ever (finished ones included). */
  hasAnyDebtHistory: boolean
  overdueCount: number
  reserve: ReserveStatus
  portfolioValue: number
  investedThisMonth: number
}

// Mode-specific card shown right under the "Disponível" hero — this is where
// the onboarding goal turns into a visibly different home screen.
export function FocusCard(props: FocusCardProps) {
  if (props.mode === 'debt') return <DebtFocus {...props} />
  if (props.mode === 'invest') return <InvestFocus {...props} />
  return null
}

function ModeChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent-500 bg-accent-500/10 rounded-full px-2 py-0.5">
      {children}
    </span>
  )
}

function DebtFocus({ debt, hasAnyDebtHistory, overdueCount }: FocusCardProps) {
  const [switching, setSwitching] = useState(false)

  // Never registered a debt yet — nudge them to add it, otherwise the
  // whole mode has nothing to show.
  if (debt.debts.length === 0 && !hasAnyDebtHistory) {
    return (
      <Card className="p-4">
        <ModeChip><Flag size={10} /> Modo sair das dívidas</ModeChip>
        <p className="mt-2 text-sm font-semibold text-text-primary">Cadastre suas dívidas</p>
        <p className="text-xs text-text-muted mt-0.5">
          Adicione cada dívida como um parcelamento em Contas. A gente calcula quanto falta e quando você fica livre.
        </p>
        <Link
          to="/contas?add=1"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-500"
        >
          <Plus size={14} /> Adicionar dívida
        </Link>
      </Card>
    )
  }

  // All plans finished and nothing overdue — the journey's next step.
  if (debt.debts.length === 0 && overdueCount === 0) {
    return (
      <Card className="p-5 border border-status-success/25 bg-status-success/8">
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            className="w-10 h-10 rounded-2xl bg-status-success/15 text-status-success flex items-center justify-center flex-shrink-0"
          >
            <PartyPopper size={18} />
          </motion.div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-text-primary">Você está livre das dívidas!</p>
            <p className="text-xs text-text-secondary mt-0.5">
              O dinheiro que ia para parcelas agora é seu. Próximo passo: fazer ele trabalhar por você.
            </p>
            <Button
              size="sm"
              className="mt-3"
              loading={switching}
              icon={<TrendingUp size={14} />}
              onClick={async () => { setSwitching(true); try { await updateFinancialGoal('invest') } finally { setSwitching(false) } }}
            >
              Ativar modo Investir
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Link to="/contas?tab=installments" className="block">
      <Card className="p-5 hover:shadow-card-hover transition-shadow">
        <div className="flex items-center justify-between">
          <ModeChip><Flag size={10} /> Modo sair das dívidas</ModeChip>
          <ChevronRight size={16} className="text-text-muted" />
        </div>

        <p className="text-xs text-text-muted mt-3">Falta quitar</p>
        <AnimatedNumber
          value={debt.totalOwed}
          className="block text-2xl font-bold text-text-primary font-heading tracking-heading"
        />

        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-text-muted">{debt.pctPaid}% quitado</span>
            <span className="text-text-muted">
              {debt.debts.length} dívida{debt.debts.length !== 1 ? 's' : ''} · {formatCurrency(debt.monthlyCommitment)}/mês
            </span>
          </div>
          <ProgressBar value={debt.pctPaid} color="#46D889" />
        </div>

        <div className="mt-4 flex items-center gap-2.5 p-3 rounded-2xl bg-accent-500/6">
          <Sparkles size={16} className="text-accent-500 flex-shrink-0" />
          <p className="text-xs text-text-secondary">
            Mantendo os pagamentos, você fica livre em{' '}
            <span className="font-semibold text-text-primary">{debtFreeLabel(debt.monthsToFree)}</span>
            <span className="text-text-muted"> ({formatMonths(debt.monthsToFree)})</span>.
          </p>
        </div>
      </Card>
    </Link>
  )
}

function InvestFocus({ reserve, portfolioValue, investedThisMonth }: FocusCardProps) {
  return (
    <Link to="/investimentos" className="block">
      <Card className="p-5 hover:shadow-card-hover transition-shadow">
        <div className="flex items-center justify-between">
          <ModeChip><TrendingUp size={10} /> Modo investir</ModeChip>
          <ChevronRight size={16} className="text-text-muted" />
        </div>

        <p className="text-xs text-text-muted mt-3">Patrimônio investido</p>
        <AnimatedNumber
          value={portfolioValue}
          className="block text-2xl font-bold text-text-primary font-heading tracking-heading"
        />
        <p className="text-xs text-text-muted mt-0.5">
          {investedThisMonth > 0
            ? <>Você aportou <span className="font-medium text-status-success">{formatCurrency(investedThisMonth)}</span> este mês</>
            : 'Nenhum aporte ainda este mês'}
        </p>

        {reserve.target > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-surface-50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-text-primary">
                <ShieldCheck size={13} className={reserve.done ? 'text-status-success' : 'text-accent-500'} />
                Reserva de emergência
              </span>
              <span className="text-xs text-text-muted">{reserve.pct}%</span>
            </div>
            <ProgressBar value={reserve.pct} size="sm" color={reserve.done ? '#46D889' : '#7A2FFF'} />
            <p className="text-[11px] text-text-muted mt-1.5">
              {reserve.done
                ? 'Completa! Agora dá para investir com mais tranquilidade em outros ativos.'
                : `${formatCurrency(reserve.liquid)} de ${formatCurrency(reserve.target)} (6 meses de despesas). Complete antes de partir para renda variável.`}
            </p>
          </div>
        )}
      </Card>
    </Link>
  )
}
