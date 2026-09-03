'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Icône compte de l'en-tête : mène au compte client, ou à la connexion
 * si personne n'est identifié.
 *
 * La session est lue dans le navigateur et non sur le serveur : le header
 * est rendu sur toutes les pages publiques, qui restent ainsi statiques.
 */
export function AccountButton() {
  const [initial, setInitial] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (!user) {
        setInitial(null)
        return
      }
      const meta = user.user_metadata ?? {}
      const name =
        ((meta.full_name ?? meta.name) as string | undefined)?.trim() ||
        user.email?.split('@')[0] ||
        '?'
      setInitial(name.charAt(0))
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <Link
      href={initial ? '/compte' : '/connexion'}
      aria-label={initial ? 'Mon compte' : 'Se connecter à mon compte'}
      title="Mon compte"
      className="grid size-12 shrink-0 place-items-center rounded-full border border-ink-200 text-ink-900 transition-colors hover:border-brand-500 hover:text-brand-900"
    >
      {initial ? (
        <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-ink-900 uppercase">
          {initial}
        </span>
      ) : (
        <User className="size-6" strokeWidth={1.7} aria-hidden />
      )}
    </Link>
  )
}
