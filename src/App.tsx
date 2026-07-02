import { lazy, Suspense, useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { OnboardingPage } from './features/onboarding/OnboardingPage'
import { useAppStore } from './store/useAppStore'
import { resetMonthlyBills } from './database/queries'

const DashboardPage   = lazy(() => import('./features/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))
const BillsPage       = lazy(() => import('./features/bills/BillsPage').then(m => ({ default: m.BillsPage })))
const CalendarPage    = lazy(() => import('./features/calendar/CalendarPage').then(m => ({ default: m.CalendarPage })))
const InvestmentsPage = lazy(() => import('./features/investments/InvestmentsPage').then(m => ({ default: m.InvestmentsPage })))
const GoalsPage       = lazy(() => import('./features/goals/GoalsPage').then(m => ({ default: m.GoalsPage })))
const ExpensesPage    = lazy(() => import('./features/expenses/ExpensesPage').then(m => ({ default: m.ExpensesPage })))

function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[60dvh]">
      <div className="w-5 h-5 rounded-full border-2 border-accent-500 border-t-transparent animate-spin" />
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
  const { lastResetKey, setLastResetKey, hasOnboarded, activeMonth, activeYear, setActiveMonth } = useAppStore()

  useEffect(() => {
    if (!hasOnboarded) return
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    const currentKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`

    if (lastResetKey !== currentKey) {
      resetMonthlyBills(currentMonth, currentYear)
        .then(() => setLastResetKey(currentKey))
    }

    // activeMonth/activeYear always mirrors the real calendar — bills marked
    // paid stay visible in Pagas until the month actually turns over, so
    // there's no legitimate reason for it to run ahead or behind anymore.
    if (activeMonth !== currentMonth || activeYear !== currentYear) {
      setActiveMonth(currentMonth, currentYear)
    }
  }, [hasOnboarded])

  return null
}

export default function App() {
  const hasOnboarded = useAppStore(s => s.hasOnboarded)

  return (
    <HashRouter>
      <ThemeSync />
      <MonthlyResetGuard />
      {!hasOnboarded ? (
        <Routes>
          <Route path="*" element={<OnboardingPage />} />
        </Routes>
      ) : (
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
            <Route path="contas" element={<Suspense fallback={<PageLoader />}><BillsPage /></Suspense>} />
            <Route path="gastos" element={<Suspense fallback={<PageLoader />}><ExpensesPage /></Suspense>} />
            <Route path="calendario" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
            <Route path="investimentos" element={<Suspense fallback={<PageLoader />}><InvestmentsPage /></Suspense>} />
            <Route path="metas" element={<Suspense fallback={<PageLoader />}><GoalsPage /></Suspense>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      )}
    </HashRouter>
  )
}
