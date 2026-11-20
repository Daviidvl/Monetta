import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabaseAdmin } from './_lib/supabase'

// Deleting an account is irreversible, so an open session alone isn't
// enough: the user must have typed their password within this window.
// The frontend re-authenticates (signInWithPassword) right before calling.
const REAUTH_MAX_AGE_SECONDS = 5 * 60

interface JwtPayload {
  sub?: unknown
  exp?: unknown
  amr?: unknown
}

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload: unknown = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    return payload && typeof payload === 'object' ? (payload as JwtPayload) : null
  } catch {
    return null
  }
}

// Supabase keeps the original sign-in time(s) in the `amr` claim
// ([{ method, timestamp }]) across token refreshes — unlike `iat`, which a
// plain refresh bumps — so it tells us when the password was last entered.
function lastSignInAt(payload: JwtPayload): number | null {
  if (!Array.isArray(payload.amr)) return null
  const times = payload.amr
    .map(entry => (entry && typeof entry === 'object' ? (entry as { timestamp?: unknown }).timestamp : undefined))
    .filter((t): t is number => typeof t === 'number')
  return times.length > 0 ? Math.max(...times) : null
}

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

  // Cheap local rejection of malformed/expired tokens before spending a
  // round-trip to Supabase Auth on them (limits cost amplification from
  // garbage requests). NOT a trust decision — getUser below is.
  const payload = decodeJwtPayload(token)
  if (!payload || typeof payload.exp !== 'number' || payload.exp * 1000 <= Date.now()) {
    res.status(401).json({ error: 'invalid token' })
    return
  }

  // Identity comes from the verified JWT, never from the request body —
  // otherwise anyone who knew another user's id could delete their account.
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user || user.id !== payload.sub) {
    res.status(401).json({ error: 'invalid token' })
    return
  }

  // getUser just verified this exact token, so its claims are trustworthy.
  const signedInAt = lastSignInAt(payload)
  if (signedInAt === null || Date.now() / 1000 - signedInAt > REAUTH_MAX_AGE_SECONDS) {
    res.status(403).json({ error: 'reauthentication required' })
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
