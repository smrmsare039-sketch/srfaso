import 'server-only'

import { createClient } from '@supabase/supabase-js'

/**
 * Client avec la clé service_role : contourne RLS.
 * Réservé au code serveur (Server Actions, Route Handlers).
 */
export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
