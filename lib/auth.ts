import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

/** Profil back-office de l'utilisateur connecté, ou null. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!data || !data.is_active) return null
    return data as Profile
  } catch {
    return null
  }
})

/** Garde utilisée par les pages et actions du back-office. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getCurrentProfile()
  if (!profile) redirect('/admin/login')
  return profile
}
