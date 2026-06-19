import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Theme } from '../types'

interface AppState {
  theme: Theme
  hasOnboarded: boolean
  activeMonth: number
  activeYear: number
  lastResetKey: string // "YYYY-MM" format

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setHasOnboarded: (v: boolean) => void
  setActiveMonth: (month: number, year: number) => void
  setLastResetKey: (key: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      hasOnboarded: false,
      activeMonth: new Date().getMonth() + 1,
      activeYear: new Date().getFullYear(),
      lastResetKey: '',

      setTheme: (theme) => {
        set({ theme })
        document.documentElement.classList.toggle('dark', theme === 'dark')
      },

      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        set({ theme: next })
        document.documentElement.classList.toggle('dark', next === 'dark')
      },

      setHasOnboarded: (v) => set({ hasOnboarded: v }),
      setActiveMonth: (month, year) => set({ activeMonth: month, activeYear: year }),
      setLastResetKey: (key) => set({ lastResetKey: key }),
    }),
    {
      name: 'monetta-app',
      onRehydrateStorage: () => (state) => {
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark')
        }
      },
    },
  ),
)
