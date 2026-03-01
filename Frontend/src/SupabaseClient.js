// src/supabaseClient.js
// Single Supabase client instance shared across the whole app.
// WHY singleton: creating multiple clients wastes connections and
// can cause auth state inconsistencies.

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)