import { createClient } from '@supabase/supabase-js'

/**
 * Client anonyme sans cookies : lecture du contenu public depuis des
 * contextes statiques (sitemap, génération de routes).
 */
export function createSupabasePublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'anon',
    { auth: { persistSession: false } }
  )
}
