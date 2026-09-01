import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CheckoutForm } from '@/components/checkout-form'
import { accountName, getCurrentUser } from '@/lib/account'
import { getSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Passer commande',
  description:
    'Finalisez votre commande de pièces moto : nom, prénom, numéro WhatsApp et ville suffisent. Aucun compte nécessaire.',
  robots: { index: false, follow: true },
}

export default async function CheckoutPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])

  // Les champs sont pré-remplis pour un client connecté, mais restent modifiables.
  const account = user
    ? {
        fullName: accountName(user),
        email: user.email ?? '',
        phone: (user.user_metadata?.phone as string | undefined) ?? '',
      }
    : null

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Panier', href: '/panier' }, { label: 'Commande' }]} />
      <h1 className="mb-5 text-2xl font-extrabold text-ink-900 sm:mb-8 sm:text-4xl">Passer commande</h1>
      <CheckoutForm whatsapp={settings.whatsapp} account={account} />
    </div>
  )
}
