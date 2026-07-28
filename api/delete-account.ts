import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from './_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }

  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined
  if (!token) {
    res.status(401).json({ error: 'missing token' })
    return
  }

  // Identity comes from the verified JWT, never from the request body —
  // otherwise anyone who knew another user's id could delete their account.
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) {
    res.status(401).json({ error: 'invalid token' })
    return
  }

  // Every table has user_id references auth.users(id) on delete cascade,
  // so deleting the auth user alone wipes all of their app data too.
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('delete-account failed', { userId: user.id, message: deleteError.message })
    res.status(500).json({ error: 'Não foi possível apagar a conta.' })
    return
  }

  res.status(200).json({ ok: true })
}
