// Base query keys — react-query's invalidateQueries matches by prefix, so
// invalidating ['incomes'] also invalidates the parameterized ['incomes', m, y].
export const queryKeys = {
  profile: ['profile'],
  bills: ['bills'],
  investments: ['investments'],
  withdrawals: ['withdrawals'],
  goals: ['goals'],
  incomes: ['incomes'],
  debitExpenses: ['debitExpenses'],
  paymentRecords: ['paymentRecords'],
  billHistory: ['billHistory'],
} as const
