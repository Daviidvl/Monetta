import { useEffect } from 'react'

// Ref-counted so a picker sheet opened on top of a Modal doesn't unlock the
// page scroll when it closes while the Modal underneath is still open.
let locks = 0

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return
    locks += 1
    document.body.style.overflow = 'hidden'
    return () => {
      locks = Math.max(0, locks - 1)
      if (locks === 0) document.body.style.overflow = ''
    }
  }, [active])
}
