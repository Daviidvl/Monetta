import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Textarea } from '../../components/ui/Input'
import type { Investment } from '../../types'
import { parseNumber, formatCurrency } from '../../utils/format'
import { addWithdrawal } from '../../database/queries'
import { fetchCoinPrice } from '../../hooks/useCryptoPrices'

interface WithdrawalFormProps {
  investment: Investment
  onClose: () => void
}

export function WithdrawalForm({ investment, onClose }: WithdrawalFormProps) {
  const isCrypto = !!investment.coinId
  const maxQuantity = investment.quantity ?? 0

  const [loading, setLoading]   = useState(false)
  const [amount, setAmount]     = useState('')
  const [quantity, setQuantity] = useState('')
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]       = useState('')

  const [livePrice, setLivePrice]     = useState<number | null>(null)
  const [loadingPrice, setLoadingPrice] = useState(isCrypto)

  // For crypto, what's available to withdraw is the CURRENT market value
  // (quantity × live price), not the original cost-basis `amount` — the
  // position may have appreciated since purchase.
  const maxAmount = isCrypto
    ? (livePrice ? maxQuantity * livePrice : investment.amount)
    : investment.amount

  useEffect(() => {
    if (!isCrypto || !investment.coinId) return
    let cancelled = false
    setLoadingPrice(true)
    fetchCoinPrice(investment.coinId).then(price => {
      if (!cancelled) {
        setLivePrice(price)
        setLoadingPrice(false)
      }
    })
    return () => { cancelled = true }
  }, [isCrypto, investment.coinId])

  function handleAmountChange(val: string) {
    setAmount(val)
    if (livePrice) {
      const amt = parseNumber(val)
      setQuantity(amt > 0 ? String(+(amt / livePrice).toFixed(8)) : '')
    }
  }

  function handleQuantityChange(val: string) {
    setQuantity(val)
    if (livePrice) {
      const qty = parseNumber(val)
      setAmount(qty > 0 ? String(+(qty * livePrice).toFixed(2)) : '')
    }
  }

  function setMax() {
    if (isCrypto) {
      setQuantity(String(maxQuantity))
      setAmount(livePrice ? String(+(maxQuantity * livePrice).toFixed(2)) : String(maxAmount))
    } else {
      setAmount(String(maxAmount))
    }
  }

  const parsedAmount   = parseNumber(amount)
  const parsedQuantity = parseNumber(quantity)
  const exceedsAmount   = parsedAmount > maxAmount * 1.001 + 0.01
  const exceedsQuantity = isCrypto && parsedQuantity > maxQuantity * 1.001 + 1e-8

  const isValid =
    parsedAmount > 0 &&
    !exceedsAmount &&
    (!isCrypto || (parsedQuantity > 0 && !exceedsQuantity))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid || !investment.id) return
    setLoading(true)
    try {
      await addWithdrawal({
        investmentId: investment.id,
        amount: Math.min(parsedAmount, maxAmount),
        quantity: isCrypto ? Math.min(parsedQuantity, maxQuantity) : undefined,
        date: new Date(`${date}T12:00:00`),
        notes: notes.trim() || undefined,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl bg-surface-50 px-3.5 py-3">
        <p className="text-xs text-text-muted mb-0.5">Disponível para saque</p>
        <p className="text-sm font-semibold text-text-primary">
          {formatCurrency(maxAmount)}
          {isCrypto && (
            <span className="text-text-muted font-normal">
              {' '}· {maxQuantity.toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {investment.coinSymbol}
            </span>
          )}
        </p>
        {isCrypto && (
          <div className="mt-1 min-h-[1rem]">
            {loadingPrice ? (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
                <RefreshCw size={10} className="animate-spin" />
                Buscando preço atual...
              </div>
            ) : livePrice ? (
              <p className="text-[11px] text-text-muted">
                1 {investment.coinSymbol} = {formatCurrency(livePrice)} (valor de mercado)
              </p>
            ) : (
              <p className="text-[11px] text-status-warning">
                Preço indisponível — usando valor investido como referência.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label="Valor (R$)"
            type="number"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={e => handleAmountChange(e.target.value)}
            prefix={<span className="text-xs font-medium">R$</span>}
            error={exceedsAmount ? 'Excede o disponível' : undefined}
          />
        </div>
        {isCrypto && (
          <div>
            <Input
              label={`Qtd. de ${investment.coinSymbol}`}
              type="number"
              step="any"
              placeholder="0"
              value={quantity}
              onChange={e => handleQuantityChange(e.target.value)}
              error={exceedsQuantity ? 'Excede o disponível' : undefined}
            />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={setMax}
        className="text-xs font-medium text-accent-500 hover:text-accent-600 transition-colors"
      >
        Sacar tudo
      </button>

      <Input
        label="Data do saque"
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
      />

      <Textarea
        label="Observações (opcional)"
        placeholder="Motivo, destino do dinheiro..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          Sacar
        </Button>
      </div>
    </form>
  )
}
