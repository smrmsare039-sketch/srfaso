import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, MapPin, Phone, Receipt } from 'lucide-react'
import { OrderActions } from '@/components/admin/order-actions'
import { Badge, Card, PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { canIssueReceipt } from '@/lib/orders'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  type OrderStatus,
  type OrderWithItems,
} from '@/lib/types'
import { formatDateTime, formatPrice, telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const dynamic = 'force-dynamic'

export default async function AdminOrderPage(props: PageProps<'/admin/commandes/[id]'>) {
  await requireAdmin()
  const { id } = await props.params
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .maybeSingle()

  if (!data) notFound()
  const order = data as OrderWithItems

  const waMessage = `Bonjour ${order.first_name}, votre commande ${order.reference} chez SUPER & RESISTANT : `

  return (
    <>
      <PageHeader
        title={`Commande ${order.reference}`}
        description={`Reçue le ${formatDateTime(order.created_at)}`}
        action={
          <Link
            href="/admin/commandes"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-ink-400"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-5">
          <Card title="Articles commandés">
            <ul className="divide-y divide-ink-50">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    {item.product_slug ? (
                      <Link
                        href={`/produits/${item.product_slug}`}
                        target="_blank"
                        className="block truncate font-semibold text-ink-900 hover:text-brand-900"
                      >
                        {item.product_name}
                      </Link>
                    ) : (
                      <span className="block truncate font-semibold text-ink-900">
                        {item.product_name}
                      </span>
                    )}
                    <span className="block text-sm text-ink-400">
                      {item.quantity} × {formatPrice(item.unit_price)}
                    </span>
                  </span>
                  <span className="shrink-0 font-bold text-ink-900">
                    {formatPrice(item.total)}
                  </span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-2 border-t border-ink-100 pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Sous-total</dt>
                <dd className="font-semibold text-ink-900">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Livraison</dt>
                <dd className="font-semibold text-ink-900">{formatPrice(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-2.5 text-base">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-display text-xl font-extrabold text-brand-800">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </Card>

          {order.notes && (
            <Card title="Observations du client">
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-600">
                {order.notes}
              </p>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Client">
            <p className="text-lg font-bold text-ink-900">
              {order.first_name} {order.last_name}
            </p>
            <div className="mt-1.5">
              <Badge tone={ORDER_STATUS_TONES[order.status as OrderStatus]}>
                {ORDER_STATUS_LABELS[order.status as OrderStatus]}
              </Badge>
            </div>

            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-800" />
                <a href={telLink(order.phone)} className="text-ink-800 hover:text-brand-900">
                  {order.phone}
                </a>
              </li>
              {order.email && (
                <li className="flex gap-2.5">
                  <Mail className="mt-0.5 size-4 shrink-0 text-brand-800" />
                  <a href={`mailto:${order.email}`} className="text-ink-800 hover:text-brand-900">
                    {order.email}
                  </a>
                </li>
              )}
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-800" />
                <span className="text-ink-800">
                  {order.city}
                  {order.district ? ` — ${order.district}` : ''}
                </span>
              </li>
            </ul>

            <a
              href={whatsappLink(order.phone, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white"
            >
              <WhatsAppIcon className="size-4" />
              Contacter sur WhatsApp
            </a>

            {canIssueReceipt(order.status as OrderStatus) && (
              <Link
                href={`/admin/recu/${order.id}`}
                className="mt-2.5 flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-200 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-900"
              >
                <Receipt className="size-4" aria-hidden />
                Reçu thermique 80 mm
              </Link>
            )}
          </Card>

          <Card title="Traitement">
            <OrderActions
              orderId={order.id}
              status={order.status as OrderStatus}
              deliveryFee={Number(order.delivery_fee)}
              adminNote={order.admin_note}
            />
          </Card>
        </div>
      </div>
    </>
  )
}
