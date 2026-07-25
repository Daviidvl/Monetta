import { useEffect } from 'react'
import { reconcilePendingExpenses } from '../../services/whatsappSync'

// Only mounted once the user is authenticated and past onboarding (see
// App.tsx) — no internal gate needed here anymore.
export function WhatsappSyncGuard() {
  useEffect(() => {
    reconcilePendingExpenses()

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') reconcilePendingExpenses()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [])

  return null
}
