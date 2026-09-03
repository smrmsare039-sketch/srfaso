import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { OrderTracker } from '@/components/order-tracker'
import { getSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Suivre ma commande',
  description:
    'Suivez l’avancement de votre commande de pièces moto SUPER & RESISTANT avec votre numéro de commande et votre téléphone. Aucun compte nécessaire.',
  alternates: { canonical: '/suivi' },
}

export default async function SuiviPage(props: PageProps<'/suivi'>) {
  const [settings, sp] = await Promise.all([getSettings(), props.searchParams])
  const raw = sp.ref
  const reference = (Array.isArray(raw) ? raw[0] : raw) ?? ''

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Suivre ma commande' }]} />
      <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">Suivre ma commande</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[0.9375rem] text-ink-500">
        Renseignez le numéro figurant sur votre reçu et le téléphone utilisé lors de la commande.
        Vous verrez immédiatement où elle en est, sans créer de compte.
      </p>

      <OrderTracker whatsapp={settings.whatsapp} defaultReference={reference} />
    </div>
  )
}
