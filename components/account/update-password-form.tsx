'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Eye, EyeOff, KeyRound } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors focus:border-brand-500'
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800'

export function UpdatePasswordForm() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)
  const toast = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('Mot de passe trop court', {
        key: 'auth',
        description: 'Choisissez au moins 6 caractères.',
      })
      return
    }
    if (password !== confirmation) {
      toast.error('Les mots de passe diffèrent', {
        key: 'auth',
        description: 'Les deux saisies doivent être identiques.',
      })
      return
    }

    setPending(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        toast.error('Modification impossible', {
          key: 'auth',
          description:
            'Votre lien de réinitialisation a peut-être expiré. Demandez-en un nouveau.',
        })
        setPending(false)
        return
      }
      toast.success('Mot de passe modifié', {
        key: 'auth',
        description: 'Vous pouvez désormais vous connecter avec ce nouveau mot de passe.',
      })
      router.replace('/compte')
      router.refresh()
    } catch {
      toast.error('Service momentanément indisponible', {
        key: 'auth',
        description: 'Réessayez dans un instant.',
      })
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="password" className={labelClass}>
          Nouveau mot de passe
        </label>
        <div className="relative">
          <input
            id="password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            required
            minLength={6}
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
        <p className="mt-1.5 text-xs text-ink-400">6 caractères minimum.</p>
      </div>

      <div>
        <label htmlFor="confirmation" className={labelClass}>
          Confirmer le mot de passe
        </label>
        <input
          id="confirmation"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          className={field}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-ink-900 transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        <KeyRound className="size-4" aria-hidden />
        {pending ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </button>
    </form>
  )
}
