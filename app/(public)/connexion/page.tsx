import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { AuthForm } from '@/components/account/auth-form'
import { getCurrentUser } from '@/lib/account'

export const metadata: Metadata = {
  title: 'Connexion à mon compte',
  description:
    'Connectez-vous à votre compte SUPER & RESISTANT pour suivre vos commandes de pièces moto.',
  robots: { index: false, follow: true },
}

export default async function ConnexionPage() {
  if (await getCurrentUser()) redirect('/compte')

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">Connexion</h1>
        <p className="mt-2 mb-8 text-[0.9375rem] text-ink-500">
          Accédez à votre compte pour retrouver l’historique de vos commandes.
        </p>

        <div className="rounded-2xl border border-ink-100 p-6 sm:p-8">
          <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-ink-50" />}>
            <AuthForm mode="connexion" />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-400">
          Le compte est facultatif : vous pouvez toujours commander sans en créer un.
        </p>
      </div>
    </div>
  )
}
