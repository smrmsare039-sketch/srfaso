import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { OrderHistory } from '@/components/account/order-history'
import { getMyOrders, requireCustomer } from '@/lib/account'

export const metadata: Metadata = {
  title: 'Historique de mes commandes',
  robots: { index: false, follow: false },
}

export default async function HistoriqueCommandesPage() {
  await requireCustomer('/compte/commandes')
  const orders = await getMyOrders()

  return (
    <div className="container-page py-14">
      <Link
        href="/compte"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 transition-colors hover:text-brand-600"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Mon compte
      </Link>

      <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[28px]">
        Historique de mes commandes
      </h1>
      <p className="mt-2 mb-8 text-[15px] text-ink-500">
        {orders.length > 0
          ? `${orders.length} commande${orders.length > 1 ? 's' : ''} passée${orders.length > 1 ? 's' : ''} avec ce compte.`
          : 'Vos commandes apparaîtront ici.'}
      </p>

      <div className="max-w-3xl">
        <OrderHistory orders={orders} />
      </div>
    </div>
  )
}
