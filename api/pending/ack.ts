import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const ids = req.body?.ids
  if (!Array.isArray(ids) || ids.some((id) => typeof id !== 'number')) {
    res.status(400).json({ error: 'ids must be a number[]' })
    return
  }

  const { error } = await supabaseAdmin.from('pending_expenses').delete().in('id', ids)

  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(200).json({ ok: true })
}
