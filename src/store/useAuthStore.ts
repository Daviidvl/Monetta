import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'

type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

interface AuthState {
  session: Session | null
  user: User | null
  status: AuthStatus
  setSession: (session: Session | null) => void
}

// No `persist` middleware here on purpose — supabase-js already persists
// the session itself (localStorage), so this store is just an in-memory
// reactive mirror of it, refreshed by AuthGuard's onAuthStateChange listener.
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  status: 'loading',
  setSession: (session) => set({
    session,
    user: session?.user ?? null,
    status: session ? 'authenticated' : 'anonymous',
  }),
}))
