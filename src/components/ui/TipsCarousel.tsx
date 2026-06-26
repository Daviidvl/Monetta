import { useRef, useState } from 'react'

export interface TipCard {
  id: string
  label: string
  labelColor: string
  bgClass: string
  icon: React.ReactNode
  text: string
}

export function TipsCarousel({ tips }: { tips: TipCard[] }) {
  const [active, setActive] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollToCard(idx: number) {
    const el = scrollRef.current
    if (!el) return
    const child = el.children[idx] as HTMLElement | undefined
    child?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
    setActive(idx)
  }

  function onScroll() {
    const el = scrollRef.current
    if (!el || tips.length === 0) return
    const cardWidth = (el.scrollWidth - 32) / tips.length
    const idx = Math.min(Math.round(el.scrollLeft / cardWidth), tips.length - 1)
    setActive(idx)
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory gap-3"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tips.map(tip => (
          <div
            key={tip.id}
            className={`flex-shrink-0 w-[calc(100%-2rem)] snap-start rounded-2xl p-4 ${tip.bgClass}`}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className={tip.labelColor}>{tip.icon}</span>
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${tip.labelColor}`}>
                {tip.label}
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{tip.text}</p>
          </div>
        ))}
        {/* trailing spacer so last card can snap to start */}
        <div className="flex-shrink-0 w-6" aria-hidden />
      </div>

      <div className="flex justify-center gap-1.5 mt-3">
        {tips.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToCard(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === active ? 'w-5 bg-accent-500' : 'w-1.5 bg-border-subtle'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
