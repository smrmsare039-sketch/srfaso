'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800'

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17Z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7A21.99 21.99 0 0 0 24 46Z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18a13.2 13.2 0 0 1 0-8.36v-5.7H4.34a22.01 22.01 0 0 0 0 19.76l7.35-5.7Z"
      />
      <path
        fill="#EA4335"
        d="M24 9.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 3.18 29.93 1 24 1 15.4 1 7.96 5.93 4.34 13.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07Z"
      />
    </svg>
  )
}

/** Un compte back-office actif est renvoyé vers l'administration, pas vers l'espace client. */
async function isBackofficeUser(
  supabase: ReturnType<typeof createSupabaseBrowserClient>
): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase
    .from('profiles')
    .select('is_active')
    .eq('id', user.id)
    .maybeSingle()
  return Boolean(data?.is_active)
}

export function AuthForm({ mode }: { mode: 'connexion' | 'inscription' }) {
  const isSignup = mode === 'inscription'
  const router = useRouter()
  const params = useSearchParams()

  const rawNext = params.get('suivant')
  const hasExplicitNext = Boolean(rawNext?.startsWith('/') && !rawNext.startsWith('//'))
  const next = hasExplicitNext ? (rawNext as string) : '/compte'

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [pending, setPending] = useState(false)
  const toast = useToast()

  // Retour d'un aller-retour OAuth échoué : le motif arrive dans l'URL.
  const oauthFailed = params.get('erreur') === 'oauth'
  useEffect(() => {
    if (!oauthFailed) return
    toast.error('Connexion avec Google impossible', {
      key: 'auth',
      description: 'La connexion a été interrompue. Réessayez ou utilisez votre e-mail.',
    })
  }, [oauthFailed, toast])

  function translate(message: string): string {
    const m = message.toLowerCase()
    if (m.includes('invalid login')) return 'E-mail ou mot de passe incorrect.'
    if (m.includes('already registered') || m.includes('already exists')) {
      return 'Un compte existe déjà avec cet e-mail. Connectez-vous.'
    }
    if (m.includes('password')) return 'Le mot de passe doit contenir au moins 6 caractères.'
    if (m.includes('email')) return 'L’adresse e-mail n’est pas valide.'
    return message
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)

    try {
      const supabase = createSupabaseBrowserClient()

      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() || null, phone: phone.trim() || null },
            emailRedirectTo: `${window.location.origin}/auth/callback?suivant=${encodeURIComponent(next)}`,
          },
        })
        if (authError) {
          toast.error('Inscription impossible', {
            key: 'auth',
            description: translate(authError.message),
          })
          setPending(false)
          return
        }
        // Sans session, Supabase attend une confirmation par e-mail.
        if (!data.session) {
          toast.success('Compte créé', {
            key: 'auth',
            duration: 12000,
            description: `Ouvrez l’e-mail de confirmation envoyé à ${email} pour activer votre compte.`,
          })
          setPending(false)
          return
        }
        toast.success('Bienvenue chez SUPER & RESISTANT', {
          key: 'auth',
          description: 'Votre compte est créé, vous êtes connecté.',
        })
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
        if (authError) {
          toast.error('Connexion impossible', {
            key: 'auth',
            description: translate(authError.message),
          })
          setPending(false)
          return
        }
        toast.success('Vous êtes connecté', { key: 'auth', description: 'Bon retour parmi nous !' })
      }

      // Un administrateur arrive directement dans le back-office.
      const destination =
        !hasExplicitNext && (await isBackofficeUser(supabase)) ? '/admin' : next
      router.replace(destination)
      router.refresh()
    } catch {
      toast.error('Service momentanément indisponible', {
        key: 'auth',
        description: 'Réessayez dans un instant.',
      })
      setPending(false)
    }
  }

  async function withGoogle() {
    setPending(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?suivant=${encodeURIComponent(next)}`,
        },
      })
      if (authError) {
        toast.error('Google indisponible', {
          key: 'auth',
          description: 'La connexion avec Google n’est pas disponible pour le moment.',
        })
        setPending(false)
      }
    } catch {
      toast.error('Google indisponible', {
        key: 'auth',
        description: 'La connexion avec Google n’est pas disponible pour le moment.',
      })
      setPending(false)
    }
  }

  return (
    <div className="space-y-5">
      <button
        type="button"
        onClick={withGoogle}
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-ink-200 bg-white text-[0.9375rem] font-semibold text-ink-900 transition-colors hover:border-ink-300 disabled:opacity-60"
      >
        <GoogleMark />
        {isSignup ? 'S’inscrire avec Google' : 'Continuer avec Google'}
      </button>

      <div className="flex items-center gap-3 text-xs font-medium text-ink-400">
        <span className="h-px flex-1 bg-ink-100" />
        ou avec votre e-mail
        <span className="h-px flex-1 bg-ink-100" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {isSignup && (
          <>
            <div>
              <label htmlFor="full_name" className={labelClass}>
                Nom complet
              </label>
              <input
                id="full_name"
                autoComplete="name"
                maxLength={120}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Numéro WhatsApp <span className="font-normal text-ink-400">(facultatif)</span>
              </label>
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="+226 70 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={field}
              />
            </div>
          </>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
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
          <label htmlFor="password" className={labelClass}>
            Mot de passe
          </label>
          <div className="relative">
            <input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
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
          {isSignup ? (
            <p className="mt-1.5 text-xs text-ink-400">6 caractères minimum.</p>
          ) : (
            <p className="mt-1.5 text-right">
              <Link
                href="/mot-de-passe-oublie"
                className="text-xs font-semibold text-ink-500 hover:text-brand-900"
              >
                Mot de passe oublié ?
              </Link>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-ink-900 transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {isSignup ? (
            <UserPlus className="size-4" aria-hidden />
          ) : (
            <LogIn className="size-4" aria-hidden />
          )}
          {pending ? 'Un instant…' : isSignup ? 'Créer mon compte' : 'Se connecter'}
        </button>
      </form>

      <p className="text-center text-sm text-ink-500">
        {isSignup ? 'Vous avez déjà un compte ? ' : 'Pas encore de compte ? '}
        <Link
          href={
            isSignup
              ? `/connexion?suivant=${encodeURIComponent(next)}`
              : `/inscription?suivant=${encodeURIComponent(next)}`
          }
          className="font-bold text-brand-800 hover:text-brand-900"
        >
          {isSignup ? 'Se connecter' : 'Créer un compte'}
        </Link>
      </p>
    </div>
  )
}
