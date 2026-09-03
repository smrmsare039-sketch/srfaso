'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Check, PackageSearch, Search } from 'lucide-react'
import { trackOrder, type TrackedOrder } from '@/lib/actions/public'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types'
import { cx, formatDate, formatPrice, whatsappLink } from '@/lib/utils'

/** Étapes visibles par le client, dans l'ordre du traitement. */
const STEPS: OrderStatus[] = ['nouvelle', 'confirmee', 'preparation', 'expediee', 'livree']

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800'

function Timeline({ status }: { status: OrderStatus }) {
  if (status === 'annulee') {
    return (
      <p className="rounded-xl bg-ink-50 px-4 py-3 text-sm font-semibold text-ink-600">
        Cette commande a été annulée. Contactez-nous si c’est une erreur.
      </p>
    )
  }

  const currentIndex = STEPS.indexOf(status)

  return (
    <ol className="space-y-3">
      {STEPS.map((step, index) => {
        const done = index <= currentIndex
        const current = index === currentIndex
        return (
          <li key={step} className="flex items-center gap-3">
            <span
              className={cx(
                'grid size-7 shrink-0 place-items-center rounded-full border text-xs font-bold',
                done
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-ink-200 text-ink-300'
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
            </span>
            <span
              className={cx(
                'text-sm',
                current ? 'font-bold text-ink-900' : done ? 'text-ink-700' : 'text-ink-400'
              )}
            >
              {ORDER_STATUS_LABELS[step]}
              {current && <span className="ml-2 text-xs font-semibold text-brand-600">en cours</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function OrderTracker({
  whatsapp,
  defaultReference = '',
}: {
  whatsapp: string | null
  defaultReference?: string
}) {
  const [reference, setReference] = useState(defaultReference)
  const [phone, setPhone] = useState('')
  const [order, setOrder] = useState<TrackedOrder | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.3fr]">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          startTransition(async () => {
            const result = await trackOrder(reference, phone)
            if (result.ok && result.data) {
              setOrder(result.data)
              setError(null)
            } else if (!result.ok) {
              setOrder(null)
              setError(result.error)
            }
          })
        }}
        className="h-fit rounded-2xl border border-ink-100 p-6"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="reference" className={labelClass}>
              Numéro de commande
            </label>
            <input
              id="reference"
              required
              maxLength={40}
              placeholder="SR-2026-001"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={`${field} uppercase`}
            />
            <p className="mt-1.5 text-xs text-ink-400">
              Il figure sur votre reçu et dans le message WhatsApp de confirmation.
            </p>
          </div>

          <div>
            <label htmlFor="track_phone" className={labelClass}>
              Téléphone de la commande
            </label>
            <input
              id="track_phone"
              type="tel"
              inputMode="tel"
              required
              maxLength={30}
              placeholder="+226 70 00 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={field}
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <Search className="size-4" aria-hidden />
            {pending ? 'Recherche…' : 'Suivre ma commande'}
          </button>
        </div>
      </form>

      <div>
        {!order ? (
          <div className="grid h-full place-items-center rounded-2xl border border-dashed border-ink-200 p-10 text-center">
            <div>
              <PackageSearch
                className="mx-auto size-10 text-ink-300"
                strokeWidth={1.4}
                aria-hidden
              />
              <p className="mt-4 font-bold text-ink-900">Où en est ma commande ?</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-500">
                Renseignez votre numéro de commande et le téléphone utilisé lors de l’achat. Aucun
                compte n’est nécessaire.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-ink-100 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-display text-xl font-extrabold text-ink-900">
                  {order.reference}
                </p>
                <p className="mt-0.5 text-sm text-ink-400">
                  Commandé le {formatDate(order.created_at)}
                </p>
              </div>
              <span className="font-display text-xl font-extrabold text-ink-900">
                {formatPrice(order.total)}
              </span>
            </div>

            <div className="my-6 border-y border-ink-100 py-6">
              <Timeline status={order.status} />
            </div>

            <ul className="space-y-3">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                    {item.image_url ? (
                      <Image src={item.image_url} alt="" fill sizes="48px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    {item.product_slug ? (
                      <Link
                        href={`/produits/${item.product_slug}`}
                        className="block truncate text-sm font-medium text-ink-900 hover:text-brand-600"
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

            <p className="mt-6 border-t border-ink-100 pt-4 text-sm text-ink-500">
              Livraison à {order.city}
              {order.district ? `, ${order.district}` : ''}.
            </p>

            {whatsapp && (
              <a
                href={whatsappLink(
                  whatsapp,
                  `Bonjour, au sujet de ma commande ${order.reference}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex h-11 items-center justify-center rounded-xl border border-ink-200 text-sm font-semibold text-ink-800 transition-colors hover:border-[#25D366] hover:text-[#25D366]"
              >
                Une question sur cette commande ?
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
