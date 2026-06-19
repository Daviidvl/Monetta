import { useState, useEffect, useRef } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input, Select, Textarea } from '../../components/ui/Input'
import type { Investment, InvestmentType } from '../../types'
import { INVESTMENT_TYPE_LABELS } from '../../types'
import { parseNumber, formatCurrency } from '../../utils/format'
import { addInvestment, updateInvestment } from '../../database/queries'
import { searchCoins, fetchCoinPrice } from '../../hooks/useCryptoPrices'

interface InvestmentFormProps {
  investment?: Investment
  onClose: () => void
}

const typeOptions = Object.entries(INVESTMENT_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))

interface CoinResult { id: string; name: string; symbol: string }

export function InvestmentForm({ investment, onClose }: InvestmentFormProps) {
  const [loading, setLoading]       = useState(false)
  const [name, setName]             = useState(investment?.name ?? '')
  const [type, setType]             = useState<InvestmentType>(investment?.type ?? 'savings')
  const [platform, setPlatform]     = useState(investment?.platform ?? '')
  const [amount, setAmount]         = useState(investment?.amount ? String(investment.amount) : '')
  const [quantity, setQuantity]     = useState(investment?.quantity ? String(investment.quantity) : '')
  const [coinId, setCoinId]         = useState(investment?.coinId ?? '')
  const [coinSymbol, setCoinSymbol] = useState(investment?.coinSymbol ?? '')
  const [date, setDate] = useState(
    investment?.date
      ? new Date(investment.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
  )
  const [notes, setNotes] = useState(investment?.notes ?? '')

  // Crypto coin search
  const [coinSearch, setCoinSearch]     = useState(
    investment?.coinId
      ? `${investment.name} (${investment.coinSymbol?.toUpperCase()})`
      : '',
  )
  const [coinResults, setCoinResults]   = useState<CoinResult[]>([])
  const [searchingCoin, setSearchingCoin] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Live price for the selected coin (used for auto-conversion)
  const [currentPrice, setCurrentPrice]   = useState<number | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const isCrypto = type === 'crypto'

  // If editing an existing crypto investment, fetch its current price on mount
  useEffect(() => {
    if (investment?.coinId) {
      setFetchingPrice(true)
      fetchCoinPrice(investment.coinId).then(p => {
        setCurrentPrice(p)
        setFetchingPrice(false)
      })
    }
  }, [])

  const isValid =
    name.trim().length > 0 &&
    parseNumber(amount) > 0 &&
    (!isCrypto || coinId)

  function handleTypeChange(val: InvestmentType) {
    setType(val)
    if (val === 'crypto' && !platform) setPlatform('Binance')
  }

  function handleCoinSearchChange(val: string) {
    setCoinSearch(val)
    setCoinId('')
    setCoinSymbol('')
    setName('')
    setCurrentPrice(null)
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

    // Fetch live price so we can auto-compute quantity
    setFetchingPrice(true)
    const price = await fetchCoinPrice(coin.id)
    setCurrentPrice(price)
    setFetchingPrice(false)

    // If amount already filled, auto-calc quantity
    if (price) {
      const amt = parseNumber(amount)
      if (amt > 0) setQuantity(String(+(amt / price).toFixed(8)))
    }
  }

  // When user types BRL amount → auto-fill quantity
  function handleAmountChange(val: string) {
    setAmount(val)
    if (currentPrice) {
      const amt = parseNumber(val)
      if (amt > 0) setQuantity(String(+(amt / currentPrice).toFixed(8)))
      else setQuantity('')
    }
  }

  // When user types quantity → auto-fill BRL amount
  function handleQuantityChange(val: string) {
    setQuantity(val)
    if (currentPrice) {
      const qty = parseNumber(val)
      if (qty > 0) setAmount(String(+(qty * currentPrice).toFixed(2)))
      else setAmount('')
    }
  }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setLoading(true)
    const now = new Date()
    const data: Omit<Investment, 'id'> = {
      name: name.trim(),
      type,
      platform: platform.trim(),
      amount:     parseNumber(amount),
      quantity:   isCrypto && quantity ? parseNumber(quantity) : undefined,
      coinId:     isCrypto ? coinId     : undefined,
      coinSymbol: isCrypto ? coinSymbol : undefined,
      date:       new Date(date),
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

      {/* Crypto coin search */}
      {isCrypto ? (
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-medium text-text-secondary mb-1.5">Criptomoeda</label>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            <input
              value={coinSearch}
              onChange={e => handleCoinSearchChange(e.target.value)}
              onFocus={() => coinResults.length > 0 && setShowDropdown(true)}
              placeholder="Buscar Bitcoin, Cardano, Ethereum..."
              className="w-full h-10 pl-8 pr-3 rounded-xl border border-border-base bg-surface-0 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none transition-colors"
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

          {/* Price indicator */}
          {coinId && (
            <div className="flex items-center gap-1.5 mt-1.5">
              {fetchingPrice ? (
                <RefreshCw size={10} className="text-text-muted animate-spin" />
              ) : currentPrice ? (
                <span className="text-xs text-status-success">
                  1 {coinSymbol} = {formatCurrency(currentPrice)}
                </span>
              ) : (
                <span className="text-xs text-status-warning">Preço indisponível — informe a quantidade manualmente</span>
              )}
            </div>
          )}
        </div>
      ) : (
        <Input
          label="Nome do investimento"
          placeholder="Ex: Tesouro IPCA+ 2029"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
      )}

      {/* Amount + Quantity — linked for crypto */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Input
            label={isCrypto ? 'Valor investido (R$)' : 'Valor'}
            type="number"
            step="0.01"
            placeholder="0,00"
            value={amount}
            onChange={e => handleAmountChange(e.target.value)}
            prefix={<span className="text-xs font-medium">R$</span>}
          />
          {isCrypto && currentPrice && quantity && parseNumber(amount) > 0 && (
            <p className="text-[10px] text-text-muted mt-1">
              ≈ {parseNumber(quantity).toLocaleString('pt-BR', { maximumFractionDigits: 6 })} {coinSymbol}
            </p>
          )}
        </div>

        {isCrypto ? (
          <div>
            <Input
              label={`Qtd. de ${coinSymbol || 'moedas'}`}
              type="number"
              step="any"
              placeholder="0"
              value={quantity}
              onChange={e => handleQuantityChange(e.target.value)}
            />
            {currentPrice && amount && parseNumber(quantity) > 0 && (
              <p className="text-[10px] text-text-muted mt-1">
                ≈ {formatCurrency(parseNumber(quantity) * currentPrice)}
              </p>
            )}
          </div>
        ) : (
          <Input
            label="Data"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        )}
      </div>

      {isCrypto && (
        <Input
          label="Data da compra"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
        />
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
