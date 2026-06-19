import { useState, useEffect, useRef } from 'react'

interface CoinPrice {
  brl: number
}

type PriceMap = Record<string, number>

const CACHE_TTL = 60_000 // 1 minute
const cache: { data: PriceMap; ts: number } = { data: {}, ts: 0 }

export function useCryptoPrices(coinIds: string[]): {
  prices: PriceMap
  loading: boolean
  error: boolean
  lastUpdated: Date | null
} {
  const [prices, setPrices] = useState<PriceMap>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const ids = coinIds.filter(Boolean).join(',')

  async function fetchPrices() {
    if (!ids) return
    const now = Date.now()
    if (now - cache.ts < CACHE_TTL && Object.keys(cache.data).length > 0) {
      setPrices(cache.data)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl`
      const res = await fetch(url)
      if (!res.ok) throw new Error('API error')
      const data = await res.json() as Record<string, CoinPrice>
      const result: PriceMap = {}
      for (const [id, val] of Object.entries(data)) {
        result[id] = val.brl
      }
      cache.data = result
      cache.ts = Date.now()
      setPrices(result)
      setLastUpdated(new Date())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!ids) return
    fetchPrices()
    intervalRef.current = setInterval(fetchPrices, CACHE_TTL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [ids])

  return { prices, loading, error, lastUpdated }
}

// Search coins by name
export async function searchCoins(query: string): Promise<{ id: string; name: string; symbol: string }[]> {
  if (query.length < 2) return []
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`)
    if (!res.ok) return []
    const data = await res.json() as { coins: { id: string; name: string; symbol: string }[] }
    return data.coins.slice(0, 8)
  } catch {
    return []
  }
}
