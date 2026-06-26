import { useState, useEffect, useRef, useCallback } from 'react'

export interface TipCard {
  id: string
  label: string
  labelColor: string
  bgClass: string
  icon: React.ReactNode
  text: string
}

const AUTO_INTERVAL = 5000
const PAUSE_AFTER_INTERACTION = 10000

export function TipsCarousel({ tips }: { tips: TipCard[] }) {
  const [active, setActive]   = useState(0)
  const timerRef              = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseTimeoutRef       = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isPausedRef           = useRef(false)

  // Touch swipe tracking
  const touchStartX = useRef(0)

  const goTo = useCallback((idx: number) => {
    setActive((idx + tips.length) % tips.length)
  }, [tips.length])

  const pause = useCallback(() => {
    isPausedRef.current = true
    if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    pauseTimeoutRef.current = setTimeout(() => {
      isPausedRef.current = false
    }, PAUSE_AFTER_INTERACTION)
  }, [])

  // Auto-scroll
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (!isPausedRef.current) {
        setActive(prev => (prev + 1) % tips.length)
      }
    }, AUTO_INTERVAL)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current)
    }
  }, [tips.length])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    pause()
  }

  function onTouchEnd(e: React.TouchEvent) {
    const delta = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(delta) > 40) {
      goTo(active + (delta > 0 ? 1 : -1))
    }
  }

  if (tips.length === 0) return null

  return (
    <div
      className="select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Clip container — hides adjacent cards */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {tips.map(tip => (
            <div key={tip.id} className={`flex-shrink-0 w-full p-4 ${tip.bgClass}`}>
              <div className="flex items-center gap-1.5 mb-2">
                <span className={tip.labelColor}>{tip.icon}</span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${tip.labelColor}`}>
                  {tip.label}
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); pause() }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === active ? 'w-5 bg-accent-500' : 'w-1.5 bg-border-subtle'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
