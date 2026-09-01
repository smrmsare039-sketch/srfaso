import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/account/auth-form'
import { getCurrentUser } from '@/lib/account'

export const metadata: Metadata = {
  title: 'Créer un compte',
  description:
    'Créez votre compte SUPER & RESISTANT en quelques secondes, avec Google ou une adresse e-mail, et suivez vos commandes de pièces moto.',
  robots: { index: false, follow: true },
}

export default async function InscriptionPage() {
  if (await getCurrentUser()) redirect('/compte')

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">Créer un compte</h1>
        <p className="mt-2 mb-8 text-[0.9375rem] text-ink-500">
          Suivez vos commandes et retrouvez vos coordonnées pré-remplies à chaque achat.
        </p>

        <div className="rounded-2xl border border-ink-100 p-6 sm:p-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-ink-50" />}>
            <AuthForm mode="inscription" />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Le compte est facultatif : vous pouvez toujours commander sans en créer un.
        </p>
      </div>
    </div>
  )
}
