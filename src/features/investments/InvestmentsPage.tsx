import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, TrendingUp, TrendingDown, Pencil, Trash2, RefreshCw, ArrowDownToLine, History, Undo2 } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageHeader } from '../../components/layout/PageHeader'
import { InvestmentForm } from './InvestmentForm'
import { WithdrawalForm } from './WithdrawalForm'
import { useInvestments, useWithdrawals } from '../../hooks/useData'
import { useCryptoPrices } from '../../hooks/useCryptoPrices'
import { formatCurrency } from '../../utils/format'
import { INVESTMENT_TYPE_LABELS } from '../../types'
import { deleteInvestment, deleteWithdrawal } from '../../database/queries'
import type { Investment, Withdrawal } from '../../types'
import { formatDate } from '../../utils/date'

const typeColors: Record<string, string> = {
  savings:     '#46D889',
  treasury:    '#36C5F4',
  cdb:         '#7A2FFF',
  stocks:      '#FFA534',
  crypto:      '#FFD54A',
  real_estate: '#44E4D3',
  other:       '#A3A8B8',
}

function PnlBadge({ pnl, pct }: { pnl: number; pct: number }) {
  const isPos = pnl >= 0
  return (
    <div className={`flex items-center gap-0.5 text-xs font-medium ${
      isPos ? 'text-status-success' : 'text-status-danger'
    }`}>
      {isPos ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isPos ? '+' : ''}{formatCurrency(pnl)} ({isPos ? '+' : ''}{pct.toFixed(1)}%)
    </div>
  )
}

export function InvestmentsPage() {
  const investments = useInvestments()
  const withdrawals = useWithdrawals()
  const [searchParams] = useSearchParams()
  const [addOpen, setAddOpen]             = useState(searchParams.get('add') === '1')
  const [editTarget, setEditTarget]       = useState<Investment | null>(null)
  const [deleteTarget, setDeleteTarget]   = useState<Investment | null>(null)
  const [withdrawTarget, setWithdrawTarget] = useState<Investment | null>(null)
  const [undoTarget, setUndoTarget]       = useState<Withdrawal | null>(null)
  const [showHistory, setShowHistory]     = useState(false)

  // Extract coinIds for all crypto investments
  const coinIds = useMemo(
    () => investments.filter(i => i.coinId).map(i => i.coinId!),
    [investments],
  )
  const { prices, loading: pricesLoading, error: pricesError, lastUpdated } = useCryptoPrices(coinIds)

  // Compute current value for each investment
  function currentValue(inv: Investment): number {
    if (inv.coinId && inv.quantity && prices[inv.coinId]) {
      return inv.quantity * prices[inv.coinId]
    }
    return inv.amount
  }

  const totalPurchase = investments.reduce((s, i) => s + i.amount, 0)
  const totalCurrent  = investments.reduce((s, i) => s + currentValue(i), 0)
  const totalPnl      = totalCurrent - totalPurchase
  const totalPnlPct   = totalPurchase > 0 ? (totalPnl / totalPurchase) * 100 : 0

  const byType = useMemo(() => {
    const map: Record<string, number> = {}
    for (const inv of investments) {
      map[inv.type] = (map[inv.type] ?? 0) + currentValue(inv)
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [investments, prices])

  const hasCrypto = investments.some(i => i.coinId)

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto lg:px-6 lg:pt-8">
      <PageHeader
        title="Investimentos"
        subtitle={`${investments.length} ativo${investments.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Adicionar
          </Button>
        }
      />

      {/* Total card */}
      <Card className="mb-5 bg-gradient-to-br from-surface-0 to-surface-50">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-text-muted mb-1">Patrimônio atual</p>
            <p className="text-3xl font-bold text-text-primary tracking-tight">
              {formatCurrency(totalCurrent)}
            </p>
            {totalPurchase !== totalCurrent && (
              <p className="text-xs text-text-muted mt-1">
                Investido: {formatCurrency(totalPurchase)}
              </p>
            )}
          </div>
          {totalPnl !== 0 && (
            <div className="text-right">
              <p className="text-xs text-text-muted mb-1">Resultado</p>
              <PnlBadge pnl={totalPnl} pct={totalPnlPct} />
            </div>
          )}
        </div>
        {hasCrypto && (
          <div className="flex items-center gap-1.5 mt-3 text-xs text-text-muted">
            <RefreshCw size={11} className={pricesLoading ? 'animate-spin' : ''} />
            {pricesError
              ? 'Sem conexão — preços offline'
              : lastUpdated
              ? `Atualizado ${lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : 'Carregando preços...'}
          </div>
        )}
      </Card>

      {/* Distribution */}
      {byType.length > 1 && (
        <Card className="mb-5">
          <p className="text-xs font-medium text-text-secondary mb-3">Distribuição</p>
          <div className="space-y-2.5">
            {byType.map(([type, amount]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[type] }} />
                    <span className="text-xs text-text-secondary">
                      {INVESTMENT_TYPE_LABELS[type as keyof typeof INVESTMENT_TYPE_LABELS]}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-text-primary">{formatCurrency(amount)}</span>
                    <span className="text-xs text-text-muted ml-1.5">
                      {Math.round((amount / totalCurrent) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="h-1 rounded-full bg-surface-200 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: typeColors[type] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(amount / totalCurrent) * 100}%` }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Investment list */}
      <Card padded={false}>
        <AnimatePresence mode="popLayout">
          {investments.length === 0 ? (
            <EmptyState
              key="empty"
              icon={<TrendingUp size={20} />}
              title="Nenhum investimento ainda"
              description="Registre seus investimentos para acompanhar seu patrimônio."
              action={
                <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
                  Adicionar investimento
                </Button>
              }
            />
          ) : (
            investments.map(inv => {
              const cur  = currentValue(inv)
              const pnl  = cur - inv.amount
              const pct  = inv.amount > 0 ? (pnl / inv.amount) * 100 : 0
              const hasPnl = inv.coinId && inv.quantity && prices[inv.coinId]

              return (
                <motion.div
                  key={inv.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle last:border-0"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${typeColors[inv.type]}18` }}
                  >
                    {inv.coinSymbol ? (
                      <span className="text-[10px] font-bold" style={{ color: typeColors[inv.type] }}>
                        {inv.coinSymbol.slice(0, 3)}
                      </span>
                    ) : (
                      <TrendingUp size={16} style={{ color: typeColors[inv.type] }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{inv.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-text-muted">
                        {INVESTMENT_TYPE_LABELS[inv.type]}
                      </span>
                      {inv.platform && (
                        <>
                          <span className="text-text-muted">·</span>
                          <span className="text-xs text-text-muted">{inv.platform}</span>
                        </>
                      )}
                      {inv.quantity && (
                        <>
                          <span className="text-text-muted">·</span>
                          <span className="text-xs text-text-muted">{inv.quantity} un</span>
                        </>
                      )}
                    </div>
                    {/* P&L row for crypto */}
                    {hasPnl && (
                      <div className="mt-0.5">
                        <PnlBadge pnl={pnl} pct={pct} />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">{formatCurrency(cur)}</p>
                      {hasPnl ? (
                        <p className="text-xs text-text-muted">pago: {formatCurrency(inv.amount)}</p>
                      ) : (
                        <p className="text-xs text-text-muted">{formatDate(inv.date)}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => setWithdrawTarget(inv)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-accent-500/8 hover:text-accent-500 transition-colors"
                        title="Sacar"
                      >
                        <ArrowDownToLine size={12} />
                      </button>
                      <button
                        onClick={() => setEditTarget(inv)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors"
                        title="Editar"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-text-muted hover:bg-status-danger/8 hover:text-status-danger transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </Card>

      {/* Withdrawal history */}
      {withdrawals.length > 0 && (
        <div className="mt-5">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors mb-2"
          >
            <History size={13} />
            Histórico de saques ({withdrawals.length})
          </button>
          {showHistory && (
            <Card padded={false}>
              {withdrawals.map((w, i) => (
                <div
                  key={w.id}
                  className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-border-subtle' : ''}`}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-accent-500/10 text-accent-500">
                    <ArrowDownToLine size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{w.investmentName}</p>
                    <p className="text-xs text-text-muted">
                      {formatDate(w.date)}
                      {w.quantity ? ` · ${w.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} ${w.coinSymbol}` : ''}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-text-primary flex-shrink-0">
                    {formatCurrency(w.amount)}
                  </p>
                  <button
                    onClick={() => setUndoTarget(w)}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-text-muted hover:bg-surface-100 transition-colors flex-shrink-0"
                    title="Desfazer saque"
                  >
                    <Undo2 size={13} />
                  </button>
                </div>
              ))}
            </Card>
          )}
        </div>
      )}

      {/* Modals */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Novo investimento">
        <InvestmentForm onClose={() => setAddOpen(false)} />
      </Modal>
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Editar investimento">
        {editTarget && <InvestmentForm investment={editTarget} onClose={() => setEditTarget(null)} />}
      </Modal>
      <Modal open={!!withdrawTarget} onClose={() => setWithdrawTarget(null)} title="Sacar investimento">
        {withdrawTarget && <WithdrawalForm investment={withdrawTarget} onClose={() => setWithdrawTarget(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => { await deleteInvestment(deleteTarget!.id!); setDeleteTarget(null) }}
        title="Excluir investimento"
        description={`Excluir "${deleteTarget?.name}"?`}
        confirmLabel="Excluir"
      />
      <ConfirmDialog
        open={!!undoTarget}
        onClose={() => setUndoTarget(null)}
        onConfirm={async () => { await deleteWithdrawal(undoTarget!.id!); setUndoTarget(null) }}
        title="Desfazer saque"
        description={`O valor de ${undoTarget ? formatCurrency(undoTarget.amount) : ''} voltará para "${undoTarget?.investmentName}".`}
        confirmLabel="Desfazer"
      />
    </div>
  )
}
