'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ExternalLink, Loader2, Mail, MapPin, Phone } from 'lucide-react'
import { Badge } from '@/components/admin/ui'
import { Modal } from '@/components/admin/modal'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { fetchOrderDetail } from '@/lib/actions/orders'
import { orderConfirmationMessage } from '@/lib/orders'
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  type OrderStatus,
  type OrderWithItems,
} from '@/lib/types'
import { formatDateTime, formatPrice, telLink, whatsappLink } from '@/lib/utils'

export function OrderDetailModal({
  orderId,
  reference,
  companyName,
  open,
  onClose,
}: {
  orderId: string
  reference: string
  companyName: string
  open: boolean
  onClose: () => void
}) {
  // Le résultat porte l'identifiant chargé : changer de commande affiche donc
  // le chargement sans avoir à remettre l'état à zéro dans l'effet.
  const [loaded, setLoaded] = useState<{
    id: string
    order?: OrderWithItems
    error?: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    fetchOrderDetail(orderId).then((result) => {
      if (!active) return
      setLoaded(
        result.ok ? { id: orderId, order: result.data } : { id: orderId, error: result.error }
      )
    })
    return () => {
      active = false
    }
  }, [open, orderId])

  const current = loaded?.id === orderId ? loaded : null
  const order = current?.order ?? null
  const error = current?.error ?? null

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={`Commande ${reference}`}
      description={order ? formatDateTime(order.created_at) : 'Chargement…'}
    >
      <div className="p-4 sm:p-5">
        {!order && !error && (
          <div className="flex h-56 items-center justify-center text-ink-400">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span className="sr-only">Chargement de la commande…</span>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-danger-50 px-4 py-3 text-sm font-medium text-danger-700"
          >
            {error}
          </p>
        )}

        {order && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge tone={ORDER_STATUS_TONES[order.status as OrderStatus]}>
                {ORDER_STATUS_LABELS[order.status as OrderStatus]}
              </Badge>
              <span className="font-display text-xl font-extrabold text-ink-900">
                {formatPrice(order.total)}
              </span>
            </div>

            <div className="rounded-xl border border-ink-100 p-4">
              <p className="font-bold text-ink-900">
                {order.first_name} {order.last_name}
              </p>
              <ul className="mt-2.5 space-y-1.5 text-sm">
                <li className="flex gap-2.5">
                  <Phone className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
                  <a href={telLink(order.phone)} className="text-ink-800 hover:text-brand-900">
                    {order.phone}
                  </a>
                </li>
                {order.email && (
                  <li className="flex gap-2.5">
                    <Mail className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
                    <a
                      href={`mailto:${order.email}`}
                      className="text-ink-800 hover:text-brand-900"
                    >
                      {order.email}
                    </a>
                  </li>
                )}
                <li className="flex gap-2.5">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-800" aria-hidden />
                  <span className="text-ink-800">
                    {order.city}
                    {order.district ? ` — ${order.district}` : ''}
                  </span>
                </li>
              </ul>
              {order.notes && (
                <p className="mt-3 border-t border-ink-100 pt-3 text-sm text-ink-600">
                  {order.notes}
                </p>
              )}
            </div>

            <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100">
              {(order.items ?? []).map((item) => (
                <li key={item.id} className="flex items-center gap-3 p-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {item.product_name}
                    </span>
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

            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Sous-total</dt>
                <dd className="font-medium text-ink-800">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Livraison</dt>
                <dd className="font-medium text-ink-800">{formatPrice(order.delivery_fee)}</dd>
              </div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5">
                <dt className="font-bold text-ink-900">Total</dt>
                <dd className="font-bold text-ink-900">{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <div className="pb-safe flex flex-col gap-2 sm:flex-row sm:pb-0">
              <a
                href={whatsappLink(
                  order.phone,
                  orderConfirmationMessage(order, order.items ?? [], companyName)
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="size-4" />
                Confirmer sur WhatsApp
              </a>
              <Link
                href={`/admin/commandes/${order.id}`}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-ink-200 text-sm font-semibold text-ink-800 transition-colors hover:border-ink-900"
              >
                <ExternalLink className="size-4" aria-hidden />
                Fiche complète
              </Link>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
