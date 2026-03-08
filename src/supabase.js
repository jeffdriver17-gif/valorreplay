import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://pwowvyvuokykyzjfpnlc.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_OCPpntDuJOezoYBhb2WZ_w_J0AVIY7s'
)
