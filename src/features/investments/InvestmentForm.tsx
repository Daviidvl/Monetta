import { useState, useEffect, useRef } from 'react'
import { Search, RefreshCw, Clock } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import type { Investment, InvestmentType } from '../../types'
import { INVESTMENT_TYPE_LABELS } from '../../types'
import { parseNumber, formatCurrency } from '../../utils/format'
import { addInvestment, updateInvestment } from '../../database/queries'
import {
  searchCoins,
  fetchCoinPrice,
  fetchHistoricalPrice,
  type HistoricalPrice,
} from '../../hooks/useCryptoPrices'

interface InvestmentFormProps {
  investment?: Investment
  onClose: () => void
}

const typeOptions = Object.entries(INVESTMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

interface CoinResult { id: string; name: string; symbol: string }

// "YYYY-MM-DDTHH:MM" in local time — for datetime-local inputs
function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function InvestmentForm({ investment, onClose }: InvestmentFormProps) {
  const [loading, setLoading]       = useState(false)
  const [name, setName]             = useState(investment?.name ?? '')
  const [type, setType]             = useState<InvestmentType>(investment?.type ?? 'savings')
  const [platform, setPlatform]     = useState(investment?.platform ?? '')
  const [amount, setAmount]         = useState(investment?.amount ? String(investment.amount) : '')
  const [quantity, setQuantity]     = useState(investment?.quantity ? String(investment.quantity) : '')
  const [coinId, setCoinId]         = useState(investment?.coinId ?? '')
  const [coinSymbol, setCoinSymbol] = useState(investment?.coinSymbol ?? '')
  const [datetime, setDatetime]     = useState(
    investment?.date ? toDatetimeLocal(new Date(investment.date)) : toDatetimeLocal(new Date()),
  )
  const [notes, setNotes] = useState(investment?.notes ?? '')

  // Price state — either historical (for a past datetime) or live
  const [priceInfo, setPriceInfo]         = useState<HistoricalPrice | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [priceError, setPriceError]       = useState(false)

  // Coin search
  const [coinSearch, setCoinSearch]       = useState(
    investment?.coinId ? `${investment.name} (${investment.coinSymbol?.toUpperCase()})` : '',
  )
  const [coinResults, setCoinResults]     = useState<CoinResult[]>([])
  const [searchingCoin, setSearchingCoin] = useState(false)
  const [showDropdown, setShowDropdown]   = useState(false)

  const searchTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const priceTimer   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef  = useRef<HTMLDivElement>(null)

  const isCrypto = type === 'crypto'
  const isValid  =
    name.trim().length > 0 &&
    parseNumber(amount) > 0 &&
    (!isCrypto || (coinId && parseNumber(quantity) > 0))

  // Fetch price whenever coin or datetime changes
  async function loadPrice(id: string, dt: string) {
    if (!id || !dt) return
    setFetchingPrice(true)
    setPriceError(false)
    setPriceInfo(null)

    const selectedDate = new Date(dt)
    const now          = new Date()
    const diffMs       = now.getTime() - selectedDate.getTime()
    const isRecent     = diffMs < 5 * 60_000 // less than 5 min ago → use live price

    try {
      if (isRecent) {
        const livePrice = await fetchCoinPrice(id)
        if (livePrice !== null) {
          setPriceInfo({ price: livePrice, granularity: 'hourly', resolvedAt: now })
        } else {
          setPriceError(true)
        }
      } else {
        const hist = await fetchHistoricalPrice(id, selectedDate)
        if (hist) {
          setPriceInfo(hist)
        } else {
          setPriceError(true)
        }
      }
    } finally {
      setFetchingPrice(false)
    }
  }

  // Debounced re-fetch when datetime changes
  function handleDatetimeChange(val: string) {
    setDatetime(val)
    if (!coinId) return
    if (priceTimer.current) clearTimeout(priceTimer.current)
    priceTimer.current = setTimeout(() => loadPrice(coinId, val), 600)
  }

  // Auto-fill quantity when amount changes (using current priceInfo)
  function handleAmountChange(val: string) {
    setAmount(val)
    if (priceInfo) {
      const amt = parseNumber(val)
      if (amt > 0) setQuantity(String(+(amt / priceInfo.price).toFixed(8)))
      else setQuantity('')
    }
  }

  // Auto-fill amount when quantity changes
  function handleQuantityChange(val: string) {
    setQuantity(val)
    if (priceInfo) {
      const qty = parseNumber(val)
      if (qty > 0) setAmount(String(+(qty * priceInfo.price).toFixed(2)))
      else setAmount('')
    }
  }

  // Coin search input
  function handleCoinSearchChange(val: string) {
    setCoinSearch(val)
    setCoinId('')
    setCoinSymbol('')
    setName('')
    setPriceInfo(null)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (val.length < 2) { setCoinResults([]); return }
    setSearchingCoin(true)
    searchTimer.current = setTimeout(async () => {
      const results = await searchCoins(val)
      setCoinResults(results)
      setSearchingCoin(false)
      setShowDropdown(true)
    }, 350)
  }

  async function selectCoin(coin: CoinResult) {
    setCoinId(coin.id)
    setCoinSymbol(coin.symbol.toUpperCase())
    setName(coin.name)
    setCoinSearch(`${coin.name} (${coin.symbol.toUpperCase()})`)
    setCoinResults([])
    setShowDropdown(false)
    await loadPrice(coin.id, datetime)
  }

  // If editing an existing crypto, load price on mount
  useEffect(() => {
    if (investment?.coinId && investment.date) {
      loadPrice(investment.coinId, toDatetimeLocal(new Date(investment.date)))
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleTypeChange(val: InvestmentType) {
    setType(val)
    if (val === 'crypto' && !platform) setPlatform('Binance')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const now = new Date()
    const data: Omit<Investment, 'id'> = {
      name:       name.trim(),
      type,
      platform:   platform.trim(),
      amount:     parseNumber(amount),
      quantity:   isCrypto && quantity ? parseNumber(quantity) : undefined,
      coinId:     isCrypto ? coinId     : undefined,
      coinSymbol: isCrypto ? coinSymbol : undefined,
      date:       new Date(datetime),
      notes:      notes.trim() || undefined,
      createdAt:  investment?.createdAt ?? now,
      updatedAt:  now,
    }
    try {
      if (investment?.id) {
        await updateInvestment(investment.id, data)
      } else {
        await addInvestment(data)
      }
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type + Platform */}
      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Tipo"
          value={type}
          onChange={e => handleTypeChange(e.target.value as InvestmentType)}
          options={typeOptions}
        />
        <Input
          label="Plataforma"
          placeholder="Nubank, XP, Binance..."
          value={platform}
          onChange={e => setPlatform(e.target.value)}
        />
      </div>

      {/* Crypto flow */}
      {isCrypto ? (
        <>
          {/* Coin search */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Criptomoeda</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                value={coinSearch}
                onChange={e => handleCoinSearchChange(e.target.value)}
                onFocus={() => coinResults.length > 0 && setShowDropdown(true)}
                placeholder="Buscar Bitcoin, Cardano, Ethereum..."
                className="w-full h-12 pl-8 pr-3 rounded-[14px] border border-border-base bg-surface-0 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:shadow-[0_0_0_4px_rgba(122,47,255,.15)] transition-all"
              />
              {searchingCoin && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
              )}
            </div>

            {showDropdown && coinResults.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-surface-0 border border-border-base rounded-xl shadow-elevated overflow-hidden">
                {coinResults.map(coin => (
                  <button
                    key={coin.id}
                    type="button"
                    onClick={() => selectCoin(coin)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-100 transition-colors"
                  >
                    <span className="text-xs font-bold text-text-muted w-10 flex-shrink-0">
                      {coin.symbol.toUpperCase()}
                    </span>
                    <span className="text-sm text-text-primary">{coin.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Purchase datetime */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 flex items-center gap-1.5">
              <Clock size={12} />
              Data e hora da compra
            </label>
            <input
              type="datetime-local"
              value={datetime}
              max={toDatetimeLocal(new Date())}
              onChange={e => handleDatetimeChange(e.target.value)}
              className="w-full h-12 px-3 rounded-[14px] border border-border-base bg-surface-0 text-sm text-text-primary focus:border-accent-500 focus:outline-none focus:shadow-[0_0_0_4px_rgba(122,47,255,.15)] transition-all"
            />

            {/* Price indicator */}
            <div className="mt-1.5 min-h-[1.25rem]">
              {fetchingPrice ? (
                <div className="flex items-center gap-1.5 text-xs text-text-muted">
                  <RefreshCw size={11} className="animate-spin" />
                  Buscando preço histórico...
                </div>
              ) : priceInfo && coinId ? (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-medium text-status-success">
                    1 {coinSymbol} = {formatCurrency(priceInfo.price)}
                  </span>
                  <span className="text-[10px] text-text-muted">
                    {priceInfo.granularity === 'hourly'
                      ? `às ${priceInfo.resolvedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} de ${priceInfo.resolvedAt.toLocaleDateString('pt-BR')}`
                      : `média do dia ${priceInfo.resolvedAt.toLocaleDateString('pt-BR')}`}
                  </span>
                </div>
              ) : priceError && coinId ? (
                <p className="text-xs text-status-warning">
                  Preço histórico indisponível — insira o valor manualmente.
                </p>
              ) : coinId ? (
                <p className="text-xs text-text-muted">Selecione a data/hora para buscar o preço.</p>
              ) : null}
            </div>
          </div>

          {/* Amount + Quantity — linked via historical price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Input
                label="Valor investido (R$)"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={amount}
                onChange={e => handleAmountChange(e.target.value)}
                prefix={<span className="text-xs font-medium">R$</span>}
              />
              {priceInfo && quantity && parseNumber(amount) > 0 && (
                <p className="text-[10px] text-text-muted mt-1">
                  ≈ {parseNumber(quantity).toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {coinSymbol}
                </p>
              )}
            </div>
            <div>
              <Input
                label={`Qtd. de ${coinSymbol || 'moedas'}`}
                type="number"
                step="any"
                placeholder="0"
                value={quantity}
                onChange={e => handleQuantityChange(e.target.value)}
              />
              {priceInfo && amount && parseNumber(quantity) > 0 && (
                <p className="text-[10px] text-text-muted mt-1">
                  ≈ {formatCurrency(parseNumber(quantity) * priceInfo.price)}
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <Input
            label="Nome do investimento"
            placeholder="Ex: Tesouro IPCA+ 2029"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Valor"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              prefix={<span className="text-xs font-medium">R$</span>}
            />
            <Input
              label="Data"
              type="date"
              value={datetime.split('T')[0]}
              onChange={e => setDatetime(`${e.target.value}T00:00`)}
            />
          </div>
        </>
      )}

      <Textarea
        label="Observações"
        placeholder="Rentabilidade, detalhes..."
        value={notes}
        onChange={e => setNotes(e.target.value)}
        rows={2}
      />

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary" fullWidth disabled={!isValid} loading={loading}>
          {investment ? 'Salvar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  )
}
