type PriceMap = Record<string, number>

interface CoinPrice { brl: number }

// Fetch a single coin's current price
export async function fetchCoinPrice(coinId: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`,
    )
    if (!res.ok) return null
    const data = (await res.json()) as Record<string, CoinPrice>
    return data[coinId]?.brl ?? null
  } catch {
    return null
  }
}

// Live prices hook — refreshes every 30 seconds
import { useState, useEffect } from 'react'

export function useCryptoPrices(coinIds: string[]): {
  prices: PriceMap
  loading: boolean
  error: boolean
  lastUpdated: Date | null
} {
  const [prices, setPrices]           = useState<PriceMap>({})
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Stable, sorted key so the effect only re-runs when coin list actually changes
  const ids = [...new Set(coinIds.filter(Boolean))].sort().join(',')

  useEffect(() => {
    if (!ids) {
      setPrices({})
      setError(false)
      return
    }

    let cancelled = false

    async function loadPrices() {
      if (cancelled) return
      setLoading(true)
      setError(false)
      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=brl`,
        )
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as Record<string, CoinPrice>
        if (cancelled) return
        const result: PriceMap = {}
        for (const [id, val] of Object.entries(data)) {
          result[id] = val.brl
        }
        setPrices(result)
        setLastUpdated(new Date())
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadPrices()
    const timer = setInterval(loadPrices, 30_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [ids])

  return { prices, loading, error, lastUpdated }
}

// Search coins by name
export async function searchCoins(
  query: string,
): Promise<{ id: string; name: string; symbol: string }[]> {
  if (query.length < 2) return []
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`,
    )
    if (!res.ok) return []
    const data = (await res.json()) as { coins: { id: string; name: string; symbol: string }[] }
    return data.coins.slice(0, 8)
  } catch {
    return []
  }
}
