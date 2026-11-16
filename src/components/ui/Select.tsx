import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { PickerSurface } from './PickerSurface'
import { useIsDesktop } from '../../hooks/useMediaQuery'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
  description?: string
  icon?: React.ReactNode
  /** Tailwind classes for the icon chip (text + bg), e.g. 'text-[#FFA534] bg-[#FFA534]/12'. */
  iconClass?: string
}

interface SelectProps<T extends string> {
  label?: string
  value: T
  onChange: (value: T) => void
  options: SelectOption<T>[]
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  className?: string
  id?: string
}

// Lets the user see the check land on the new row before the sheet slides away.
const CLOSE_DELAY = 140

function IconChip({ option, size = 'md' }: { option: SelectOption<string>; size?: 'sm' | 'md' }) {
  if (!option.icon) return null
  return (
    <span
      className={cn(
        'flex items-center justify-center flex-shrink-0',
        size === 'sm' ? 'w-7 h-7 rounded-lg' : 'w-9 h-9 rounded-xl',
        option.iconClass ?? 'text-accent-500 bg-accent-500/10',
      )}
    >
      {option.icon}
    </span>
  )
}

/**
 * Custom select: opens a bottom sheet on phones (big tap targets, drag to
 * close) and an anchored popover on desktop (full keyboard support). Replaces
 * the native <select>, whose OS picker looked out of place and zoomed on iOS.
 */
export function Select<T extends string>({
  label, value, onChange, options, placeholder = 'Selecione', error, hint, disabled, className, id,
}: SelectProps<T>) {
  const autoId = useId()
  const fieldId = id ?? autoId
  const listId = `${fieldId}-list`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout>>()
  const isDesktop = useIsDesktop()

  const [open, setOpen] = useState(false)
  const selectedIndex = options.findIndex(o => o.value === value)
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex))
  const selected = options[selectedIndex]

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  function openPicker() {
    if (disabled) return
    clearTimeout(closeTimer.current)
    setActiveIndex(Math.max(0, selectedIndex))
    setOpen(true)
  }

  function close(returnFocus = true) {
    setOpen(false)
    if (returnFocus && isDesktop) triggerRef.current?.focus()
  }

  function choose(option: SelectOption<T>) {
    if (option.value !== value) onChange(option.value)
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => close(), CLOSE_DELAY)
  }

  // When the list mounts: bring the selected row into view and (desktop) take
  // focus for keyboard navigation. A callback ref fires exactly when the
  // portal content exists, unlike an effect racing the surface's placement.
  // Stable (empty deps) so React only calls it on mount/unmount, not on every
  // render — current values are read through a ref instead.
  const latest = useRef({ selectedIndex, isDesktop })
  latest.current = { selectedIndex, isDesktop }
  const attachList = useCallback((el: HTMLDivElement | null) => {
    listRef.current = el
    if (!el) return
    const { selectedIndex: sel, isDesktop: desktop } = latest.current
    el.querySelector<HTMLElement>(`[data-index="${Math.max(0, sel)}"]`)?.scrollIntoView({ block: 'nearest' })
    if (desktop) el.focus({ preventScroll: true })
  }, [])

  function moveActive(next: number) {
    const idx = (next + options.length) % options.length
    setActiveIndex(idx)
    listRef.current?.querySelector<HTMLElement>(`[data-index="${idx}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  function onListKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); moveActive(activeIndex + 1); break
      case 'ArrowUp':   e.preventDefault(); moveActive(activeIndex - 1); break
      case 'Home':      e.preventDefault(); moveActive(0); break
      case 'End':       e.preventDefault(); moveActive(options.length - 1); break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (options[activeIndex]) choose(options[activeIndex])
        break
      case 'Tab': close(false); break
      default: {
        // Type-ahead: jump to the first option starting with the typed letter.
        if (e.key.length === 1) {
          const k = e.key.toLowerCase()
          const start = activeIndex + 1
          const order = [...options.slice(start), ...options.slice(0, start)]
          const hit = order.find(o => o.label.toLowerCase().startsWith(k))
          if (hit) moveActive(options.indexOf(hit))
        }
      }
    }
  }

  function onTriggerKeyDown(e: React.KeyboardEvent) {
    // While open, keys typed on the trigger drive the list too — so keyboard
    // use never depends on where focus landed.
    if (open) { onListKeyDown(e); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openPicker() }
  }

  return (
    <div className={cn('flex flex-col gap-1.5 min-w-0', className)}>
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-text-primary">
          {label}
        </label>
      )}

      <motion.button
        ref={triggerRef}
        id={fieldId}
        type="button"
        disabled={disabled}
        whileTap={{ scale: 0.985 }}
        onClick={() => (open ? close() : openPicker())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        className={cn(
          'group w-full h-12 flex items-center gap-2.5 rounded-[14px] border bg-surface-0 text-left',
          selected?.icon ? 'pl-1.5' : 'pl-3.5',
          'pr-2.5 transition-[border-color,box-shadow] duration-150 outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          open
            ? 'border-accent-500 shadow-[0_0_0_4px_rgba(122,47,255,.15)]'
            : 'border-border-base hover:border-border-strong focus-visible:border-accent-500 focus-visible:shadow-[0_0_0_4px_rgba(122,47,255,.15)]',
          error && 'border-status-danger',
        )}
      >
        {selected?.icon && <IconChip option={selected} size="sm" />}
        <span className={cn('flex-1 min-w-0 truncate text-sm', selected ? 'font-medium text-text-primary' : 'text-text-muted')}>
          {selected?.label ?? placeholder}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={cn(
            'w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
            open ? 'bg-accent-500 text-white' : 'bg-accent-500/10 text-accent-500',
          )}
        >
          <ChevronDown size={14} strokeWidth={2.4} />
        </motion.span>
      </motion.button>

      {error && <p className="text-xs text-status-danger">{error}</p>}
      {!error && hint && <p className="text-xs text-text-muted">{hint}</p>}

      <PickerSurface open={open} onClose={() => close()} anchorRef={triggerRef} title={label}>
        <div
          ref={attachList}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-labelledby={fieldId}
          aria-activedescendant={isDesktop ? `${listId}-${activeIndex}` : undefined}
          onKeyDown={onListKeyDown}
          className="flex flex-col gap-0.5 outline-none"
        >
          {options.map((option, i) => {
            const isSelected = option.value === value
            const isActive = isDesktop && i === activeIndex
            return (
              <motion.button
                key={option.value}
                id={`${listId}-${i}`}
                data-index={i}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                initial={isDesktop ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: isDesktop ? 0 : Math.min(i, 10) * 0.02, duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                whileTap={{ scale: 0.98 }}
                onMouseEnter={() => isDesktop && setActiveIndex(i)}
                onClick={() => choose(option)}
                className={cn(
                  'relative w-full flex items-center gap-3 text-left rounded-xl transition-colors',
                  isDesktop ? 'px-2.5 py-2 min-h-[40px]' : 'px-3 py-2.5 min-h-[56px]',
                  isSelected ? 'text-accent-500' : 'text-text-primary',
                  !isSelected && (isActive ? 'bg-surface-100' : 'hover:bg-surface-50 active:bg-surface-100'),
                )}
              >
                {isSelected && (
                  <motion.span
                    layoutId={`${fieldId}-highlight`}
                    className="absolute inset-0 rounded-xl bg-accent-500/8"
                    transition={{ type: 'spring', stiffness: 500, damping: 36 }}
                  />
                )}
                {option.icon && (
                  <span className="relative z-10 flex">
                    <IconChip option={option} size={isDesktop ? 'sm' : 'md'} />
                  </span>
                )}
                  <span className="relative z-10 flex-1 min-w-0">
                    <span className={cn('block text-sm truncate', isSelected ? 'font-semibold' : 'font-medium')}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="block text-xs text-text-muted mt-0.5 leading-snug">{option.description}</span>
                    )}
                  </span>
                  <span className="relative z-10 w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                        className="w-5 h-5 rounded-full bg-accent-500 text-white flex items-center justify-center"
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </span>
              </motion.button>
            )
          })}
        </div>
      </PickerSurface>
    </div>
  )
}
