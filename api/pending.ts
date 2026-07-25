import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from './_lib/supabase'
import type { PendingExpenseRow } from './_lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).end()
    return
  }

  const { data, error } = await supabaseAdmin
    .from('pending_expenses')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<PendingExpenseRow[]>()

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(200).json({ items: data })
}
