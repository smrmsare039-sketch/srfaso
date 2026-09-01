import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { OrderWithItems } from '@/lib/types'

/** Utilisateur connecté (compte client ou back-office), ou null. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
})

/** Garde des pages /compte. */
export async function requireCustomer(next = '/compte'): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(`/connexion?suivant=${encodeURIComponent(next)}`)
  return user
}

/** Nom affiché : métadonnées du compte, sinon la partie locale de l'e-mail. */
export function accountName(user: User): string {
  const meta = user.user_metadata ?? {}
  const name = (meta.full_name ?? meta.name) as string | undefined
  if (name?.trim()) return name.trim()
  return user.email?.split('@')[0] ?? 'Mon compte'
}

/**
 * Commandes du client connecté. La lecture passe par le client lié aux
 * cookies : la politique RLS `orders_own_read` fait le filtrage.
 */
export const getMyOrders = cache(async (limit = 50): Promise<OrderWithItems[]> => {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    return (data as OrderWithItems[]) ?? []
  } catch {
    return []
  }
})
