import Image from 'next/image'
import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { Badge } from '@/components/admin/ui'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderWithItems } from '@/lib/types'
import { formatDate, formatPrice } from '@/lib/utils'

export function OrderHistory({ orders }: { orders: OrderWithItems[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 p-10 text-center">
        <PackageSearch className="mx-auto size-10 text-ink-300" strokeWidth={1.4} aria-hidden />
        <p className="mt-4 font-bold text-ink-900">Aucune commande pour l’instant</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Les commandes passées avec ce compte apparaîtront ici. Celles passées sans être connecté
          restent suivies sur WhatsApp avec leur numéro de référence.
        </p>
        <Link
          href="/produits"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-600 px-5 text-sm font-bold text-ink-900 transition-colors hover:bg-brand-700"
        >
          Voir le catalogue
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-4">
      {orders.map((order) => (
        <li key={order.id} className="rounded-2xl border border-ink-100 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-extrabold text-ink-900">{order.reference}</p>
              <p className="mt-0.5 text-sm text-ink-400">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={ORDER_STATUS_TONES[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
              <span className="font-display text-lg font-extrabold text-ink-900">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          <ul className="mt-5 space-y-3 border-t border-ink-100 pt-5">
            {(order.items ?? []).map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt=""
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  {item.product_slug ? (
                    <Link
                      href={`/produits/${item.product_slug}`}
                      className="block truncate text-sm font-medium text-ink-900 hover:text-brand-900"
                    >
                      {item.product_name}
                    </Link>
                  ) : (
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {item.product_name}
                    </span>
                  )}
                  <span className="block text-xs text-ink-400">
                    {item.quantity} × {formatPrice(item.unit_price)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-ink-900">
                  {formatPrice(item.total)}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-5 border-t border-ink-100 pt-4 text-sm text-ink-500">
            Livraison à {order.city}
            {order.district ? `, ${order.district}` : ''} — nous confirmons chaque commande sur
            WhatsApp au {order.phone}.
          </p>
        </li>
      ))}
    </ul>
  )
}
