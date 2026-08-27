import { createClient } from '@supabase/supabase-js'

// Server-only: uses the service role key, so this file must never be
// imported from src/ (frontend bundle) — only from api/*.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
)
