import { useEffect } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabaseClient'
import { queryClient } from '../../lib/queryClient'
import { useAuthStore } from '../../store/useAuthStore'
import { useAppStore } from '../../store/useAppStore'

// Id of the user whose data is currently in the react-query cache.
// `undefined` = no session seen yet (first load), so nothing to wipe.
let cachedUserId: string | null | undefined

// Query keys aren't user-scoped and the cache outlives logout (gcTime), so
// on logout or account switch the cache must be wiped BEFORE the new session
// renders — otherwise the next person on the same device would briefly (or,
// offline, indefinitely) see the previous user's finances. The monthly-reset
// marker is per-browser too, so it's reset to let the new user's recurring
// bills roll over (resetMonthlyBills is idempotent).
function applySession(session: Session | null, setSession: (s: Session | null) => void) {
  const userId = session?.user.id ?? null
  if (cachedUserId !== undefined && userId !== cachedUserId) {
    queryClient.clear()
    useAppStore.getState().setLastResetKey('')
  }
  cachedUserId = userId
  setSession(session)
}

export function AuthGuard() {
  const setSession = useAuthStore(s => s.setSession)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => applySession(session, setSession))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session, setSession)
    })
    return () => subscription.unsubscribe()
  }, [setSession])

  return null
}
