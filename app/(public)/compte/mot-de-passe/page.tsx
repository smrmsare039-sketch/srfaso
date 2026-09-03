import type { Metadata } from 'next'
import { UpdatePasswordForm } from '@/components/account/update-password-form'
import { requireCustomer } from '@/lib/account'

export const metadata: Metadata = {
  title: 'Nouveau mot de passe',
  robots: { index: false, follow: false },
}

export default async function NouveauMotDePassePage() {
  // Le lien reçu par e-mail ouvre une session de récupération : sans elle,
  // on renvoie vers la connexion.
  await requireCustomer('/compte/mot-de-passe')

  return (
    <div className="container-page py-14">
      <div className="mx-auto max-w-md">
        <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 mb-8 text-[0.9375rem] text-ink-500">
          Choisissez le mot de passe que vous utiliserez pour vous connecter.
        </p>

        <div className="rounded-2xl border border-ink-100 p-6 sm:p-8">
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  )
}
