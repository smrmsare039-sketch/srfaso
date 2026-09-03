import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ForgotPasswordForm } from '@/components/account/forgot-password-form'
import { getCurrentUser } from '@/lib/account'

export const metadata: Metadata = {
  title: 'Mot de passe oublié',
  robots: { index: false, follow: true },
}

export default async function MotDePasseOubliePage() {
  if (await getCurrentUser()) redirect('/compte')

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">
          Mot de passe oublié
        </h1>
        <p className="mt-2 mb-8 text-[0.9375rem] text-ink-500">
          Indiquez l’adresse e-mail de votre compte : nous vous envoyons un lien pour choisir un
          nouveau mot de passe.
        </p>

        <div className="rounded-2xl border border-ink-100 p-6 sm:p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  )
}
