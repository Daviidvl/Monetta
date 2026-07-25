import { QueryClient } from '@tanstack/react-query'

// Single shared instance: `queries.ts` mutations invalidate through this
// directly (not via a React hook), so every existing call site that already
// calls e.g. `addBill(...)` keeps working with zero changes — the refetch
// wiring lives entirely in the data layer, not spread across every form.
export const queryClient = new QueryClient()
