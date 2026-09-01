import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Mail, Phone } from 'lucide-react'
import { OrderHistory } from '@/components/account/order-history'
import { SignOutButton } from '@/components/account/sign-out-button'
import { accountName, getMyOrders, requireCustomer } from '@/lib/account'
import { formatPrice } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Mon compte',
  robots: { index: false, follow: false },
}

export default async function ComptePage() {
  const user = await requireCustomer()
  const orders = await getMyOrders(5)

  const phone = (user.user_metadata?.phone as string | undefined) ?? null
  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0)

  return (
    <div className="container-page py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
            Mon espace
          </p>
          <h1 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">
            Bonjour {accountName(user)}
          </h1>
        </div>
        <SignOutButton />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <section className="rounded-2xl border border-ink-100 p-6">
          <h2 className="text-lg font-bold text-ink-900">Mes informations</h2>
          <ul className="mt-5 space-y-3 text-sm">
            <li className="flex items-center gap-2.5 text-ink-700">
              <Mail className="size-4 shrink-0 text-ink-400" aria-hidden />
              <span className="truncate">{user.email}</span>
            </li>
            {phone && (
              <li className="flex items-center gap-2.5 text-ink-700">
                <Phone className="size-4 shrink-0 text-ink-400" aria-hidden />
                {phone}
              </li>
            )}
          </ul>

          <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-ink-100 pt-6">
            <div>
              <dt className="text-xs font-medium text-ink-400">Commandes</dt>
              <dd className="font-display text-xl font-extrabold text-ink-900">{orders.length}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-ink-400">Montant cumulé</dt>
              <dd className="font-display text-xl font-extrabold text-ink-900">
                {formatPrice(totalSpent)}
              </dd>
            </div>
          </dl>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-lg font-bold text-ink-900">Dernières commandes</h2>
            {orders.length > 0 && (
              <Link
                href="/compte/commandes"
                className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-brand-600"
              >
                Tout l’historique
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
          <OrderHistory orders={orders} />
        </section>
      </div>
    </div>
  )
}
