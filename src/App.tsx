import { lazy, Suspense, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { AppShell } from './components/layout/AppShell'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { LoginPage } from './features/auth/LoginPage'
import { MigrationOfferPage } from './features/migration/MigrationOfferPage'
import { useAppStore } from './store/useAppStore'
import { useAuthStore } from './store/useAuthStore'
import { queryClient } from './lib/queryClient'
import { queryKeys } from './database/queryKeys'
import { getProfile, resetMonthlyBills } from './database/queries'
import { cycleMonthYear } from './utils/date'
import { hasLocalDexieData } from './services/dataMigration'
import { AuthGuard } from './components/guards/AuthGuard'
import { ToastViewport } from './components/ui/Toast'

const DashboardPage   = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BillsPage       = lazy(() => import('./features/bills/BillsPage').then(m => ({ default: m.BillsPage })))
const CalendarPage    = lazy(() => import('./features/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const InvestmentsPage = lazy(() => import('./features/investments/InvestmentsPage').then(m => ({ default: m.InvestmentsPage })))
const GoalsPage       = lazy(() => import('./features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })))
const ExpensesPage    = lazy(() => import('./features/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })))
const ProfilePage     = lazy(() => import('./features/profile/ProfilePage').then(m => ({ default: m.ProfilePage })))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60dvh]">
      <div className="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-surface-0">
      <div className="w-6 h-6 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
    </div>
  )
}

function ThemeSync() {
  const theme = useAppStore(s => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])
  return null
}

function MonthlyResetGuard() {
  const { lastResetKey, setLastResetKey, activeMonth, activeYear, setActiveMonth } = useAppStore()

  useEffect(() => {
    // activeMonth/activeYear track the billing cycle, not the raw calendar —
    // the cycle rolls to next month CYCLE_START_DAY days early (see
    // cycleMonthYear) so bills entered ahead of payday land in the right month.
    const { month: currentMonth, year: currentYear } = cycleMonthYear()
    const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    if (lastResetKey !== currentKey) {
      resetMonthlyBills(currentMonth, currentYear)
        .then(() => setLastResetKey(currentKey))
    }

    if (activeMonth !== currentMonth || activeYear !== currentYear) {
      setActiveMonth(currentMonth, currentYear)
    }
  }, [])

  return null
}

// Gates, in order: auth session -> one-time local->cloud migration offer ->
// profile exists (onboarding done) -> the actual app. Each stage reuses the
// same "guard component decides, App just branches on state" pattern.
function AuthenticatedApp() {
  const [migrationChecked, setMigrationChecked] = useState(false)
  const [needsMigrationOffer, setNeedsMigrationOffer] = useState(false)

  useEffect(() => {
    let cancelled = false
    hasLocalDexieData().then(has => {
      if (cancelled) return
      setNeedsMigrationOffer(has)
      setMigrationChecked(true)
    })
    return () => { cancelled = true }
  }, [])

  const profileQuery = useQuery({
    queryKey: queryKeys.profile,
    queryFn: getProfile,
    enabled: migrationChecked && !needsMigrationOffer,
  })

  if (!migrationChecked) return <FullPageLoader />
  if (needsMigrationOffer) {
    return <MigrationOfferPage onDone={() => setNeedsMigrationOffer(false)} />
  }
  if (profileQuery.isLoading) return <FullPageLoader />

  if (!profileQuery.data) {
    return (
      <Routes>
        <Route path="*" element={<OnboardingPage />} />
      </Routes>
    )
  }

  return (
    <>
      <MonthlyResetGuard />
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="contas" element={<Suspense fallback={<PageLoader />}><BillsPage /></Suspense>} />
          <Route path="gastos" element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
          <Route path="calendario" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
          <Route path="investimentos" element={<Suspense fallback={<PageLoader />}><InvestmentsPage /></Suspense>} />
          <Route path="metas" element={<Suspense fallback={<PageLoader />}><GoalsPage /></Suspense>} />
          <Route path="perfil" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  const authStatus = useAuthStore(s => s.status)

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthGuard />
        <ThemeSync />
        <ToastViewport />

        {authStatus === 'loading' && <FullPageLoader />}
        {authStatus === 'anonymous' && <LoginPage />}
        {authStatus === 'authenticated' && <AuthenticatedApp />}
      </BrowserRouter>
    </QueryClientProvider>
  )
}
