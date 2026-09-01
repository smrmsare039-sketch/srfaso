import type { Metadata } from 'next'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CartView } from '@/components/cart-view'
import { getSettings } from '@/lib/data'

export const metadata: Metadata = {
  title: 'Mon panier',
  description: 'Consultez votre panier et passez commande sans créer de compte.',
  robots: { index: false, follow: true },
}

export default async function CartPage() {
  const settings = await getSettings()

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Panier' }]} />
      <h1 className="mb-8 text-3xl font-extrabold text-ink-900 sm:text-4xl">Mon panier</h1>
      <CartView whatsapp={settings.whatsapp} />
    </div>
  )
}
