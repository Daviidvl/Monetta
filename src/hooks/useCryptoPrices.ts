import { useState, useEffect } from 'react'

type PriceMap = Record<string, number>
interface CoinPrice { brl: number }

// ─── Shared module-level cache ───────────────────────────────────────────────
// All hooks and standalone fetches share the same cache so we never make
// redundant API calls even when multiple components need the same coin.
const CACHE_TTL = 45_000 // 45 s — well within CoinGecko's 30 req/min free tier

const priceCache = new Map<string, { price: number; ts: number }>()
const inFlight   = new Map<string, Promise<number | null>>()

async function fetchWithRetry(url: string): Promise<Response | null> {
  try {
    const res = await fetch(url)
    if (res.status === 429) {
      // Rate-limited — wait 2 s and try once more
      await new Promise(r => setTimeout(r, 2_000))
      const retry = await fetch(url)
      return retry.ok ? retry : null
    }
    return res.ok ? res : null
  } catch {
    return null
  }
}

// Fetch one coin's price (deduplicates concurrent calls via inFlight map)
export async function fetchCoinPrice(coinId: string): Promise<number | null> {
  const cached = priceCache.get(coinId)
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.price

  if (inFlight.has(coinId)) return inFlight.get(coinId)!

  const promise = (async () => {
    const res = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=brl`,
    )
    if (!res) return null
    const data = (await res.json()) as Record<string, CoinPrice>
    const price = data[coinId]?.brl ?? null
    if (price !== null) priceCache.set(coinId, { price, ts: Date.now() })
    return price
  })().finally(() => inFlight.delete(coinId))

  inFlight.set(coinId, promise)
  return promise
}

// Fetch multiple coins in a single API call (batched)
async function fetchMultiplePrices(coinIds: string[]): Promise<PriceMap> {
  const now      = Date.now()
  const toFetch  = coinIds.filter(id => {
    const c = priceCache.get(id)
    return !c || now - c.ts >= CACHE_TTL
  })

  if (toFetch.length > 0) {
    // Deduplicate with an in-flight key for the batch
    const batchKey = [...toFetch].sort().join(',')
    if (!inFlight.has(batchKey)) {
      const promise = (async () => {
        const res = await fetchWithRetry(
          `https://api.coingecko.com/api/v3/simple/price?ids=${batchKey}&vs_currencies=brl`,
        )
        if (res) {
          const data = (await res.json()) as Record<string, CoinPrice>
          const ts2 = Date.now()
          for (const [id, val] of Object.entries(data)) {
            priceCache.set(id, { price: val.brl, ts: ts2 })
          }
        }
        return null
      })().finally(() => inFlight.delete(batchKey))
      inFlight.set(batchKey, promise)
      await promise
    } else {
      await inFlight.get(batchKey)
    }
  }

  const result: PriceMap = {}
  for (const id of coinIds) {
    const c = priceCache.get(id)
    if (c) result[id] = c.price
  }
  return result
}

// ─── React hook ──────────────────────────────────────────────────────────────
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

  const ids = [...new Set(coinIds.filter(Boolean))].sort().join(',')

  useEffect(() => {
    if (!ids) {
      setPrices({})
      setError(false)
      return
    }

    let cancelled = false

    async function refresh() {
      if (cancelled) return
      setLoading(true)
      setError(false)
      try {
        const result = await fetchMultiplePrices(ids.split(','))
        if (cancelled) return
        if (Object.keys(result).length === 0) {
          setError(true)
        } else {
          setPrices(result)
          setLastUpdated(new Date())
        }
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    // Serve from cache immediately, then refresh in background
    const instant: PriceMap = {}
    for (const id of ids.split(',')) {
      const c = priceCache.get(id)
      if (c) instant[id] = c.price
    }
    if (Object.keys(instant).length > 0) {
      setPrices(instant)
      setLastUpdated(new Date())
    }

    refresh()
    const timer = setInterval(refresh, 45_000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [ids])

  return { prices, loading, error, lastUpdated }
}

// ─── Coin search ─────────────────────────────────────────────────────────────
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
