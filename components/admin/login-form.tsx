'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)
  const toast = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) {
        toast.error('Connexion refusée', {
          key: 'admin-login',
          description: authError.message.includes('Invalid login')
            ? 'E-mail ou mot de passe incorrect.'
            : authError.message,
        })
        setPending(false)
        return
      }
      toast.success('Connexion réussie', {
        key: 'admin-login',
        description: 'Bienvenue dans le back-office.',
      })
      const next = params.get('suivant') ?? '/admin'
      router.replace(next.startsWith('/admin') ? next : '/admin')
      router.refresh()
    } catch {
      toast.error('Connexion impossible', {
        key: 'admin-login',
        description: 'Vérifiez la configuration Supabase.',
      })
      setPending(false)
    }
  }

  const field =
    'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors focus:border-brand-500'

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-semibold text-ink-800">
          Adresse e-mail
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

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-semibold text-ink-800">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${field} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            className="absolute inset-y-0 right-0 grid w-12 place-items-center text-ink-400 hover:text-ink-700"
          >
            {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        <LogIn className="size-4" aria-hidden />
        {pending ? 'Connexion…' : 'Se connecter'}
      </button>
    </form>
  )
}
