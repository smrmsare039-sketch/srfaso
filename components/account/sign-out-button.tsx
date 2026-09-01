'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const toast = useToast()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true)
        try {
          await createSupabaseBrowserClient().auth.signOut()
        } catch {
          // La session est de toute façon invalidée côté navigateur.
        }
        toast.success('Vous êtes déconnecté', {
          key: 'auth',
          description: 'À bientôt sur SUPER & RESISTANT.',
        })
        router.replace('/')
        router.refresh()
      }}
      className={
        className ??
        'inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-300 disabled:opacity-60'
      }
    >
      <LogOut className="size-4" aria-hidden />
      {pending ? 'Déconnexion…' : 'Se déconnecter'}
    </button>
  )
}
