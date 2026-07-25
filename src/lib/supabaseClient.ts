import { createClient } from '@supabase/supabase-js'

// Anon key is safe to expose in the bundle — Row Level Security on every
// table is what actually protects each user's data, not the key's secrecy.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
