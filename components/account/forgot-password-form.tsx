'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Send } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [pending, setPending] = useState(false)
  const toast = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const supabase = createSupabaseBrowserClient()
      // Le lien reçu par e-mail ouvre une session de récupération, puis la
      // page où le nouveau mot de passe est saisi.
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?suivant=/compte/mot-de-passe`,
      })
    } catch {
      // Volontairement silencieux : voir le message ci-dessous.
    }
    // Réponse identique que le compte existe ou non : sinon, ce formulaire
    // permettrait de savoir quelles adresses sont inscrites.
    setSent(true)
    setPending(false)
    toast.success('E-mail envoyé', {
      key: 'auth',
      duration: 12000,
      description: `Si un compte existe pour ${email}, le lien de réinitialisation vient d’y être envoyé.`,
    })
  }

  if (sent) {
    return (
      <div className="space-y-5 text-center">
        <p className="text-[0.9375rem] text-ink-700">
          Si un compte existe pour <strong className="font-bold">{email}</strong>, vous venez de
          recevoir un lien de réinitialisation. Il est valable une heure.
        </p>
        <p className="text-sm text-ink-500">
          Pensez à regarder dans les indésirables si l’e-mail tarde.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-sm font-bold text-brand-800 hover:text-brand-900"
        >
          Utiliser une autre adresse
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-800">
          Adresse e-mail du compte
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-ink-900 transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {pending ? 'Envoi…' : 'Recevoir le lien'}
      </button>

      <p className="text-center text-sm text-ink-500">
        <Link href="/connexion" className="font-bold text-brand-800 hover:text-brand-900">
          Retour à la connexion
        </Link>
      </p>
    </form>
  )
}
