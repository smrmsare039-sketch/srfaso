'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { formatPrice, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function CartView({ whatsapp }: { whatsapp: string | null }) {
  const { lines, ready, subtotal, setQuantity, remove, clear } = useCart()

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-ink-50" />
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink-200 py-20 text-center">
        <ShoppingBag className="mx-auto size-12 text-ink-300" strokeWidth={1.2} />
        <p className="mt-4 text-lg font-bold text-ink-900">Votre panier est vide.</p>
        <p className="mt-1.5 text-sm text-ink-500">
          Parcourez le catalogue et ajoutez les pièces dont vous avez besoin.
        </p>
        <Link
          href="/produits"
          className="mt-7 inline-block rounded-xl bg-brand-600 px-7 py-3 text-[0.9375rem] font-bold text-white hover:bg-brand-700"
        >
          Voir les produits
        </Link>
      </div>
    )
  }

  const waMessage = [
    'Bonjour, je souhaite commander :',
    '',
    ...lines.map((l) => `${l.quantity} × ${l.name} — ${formatPrice(l.price * l.quantity)}`),
    '',
    `Total : ${formatPrice(subtotal)}`,
    '',
    'Nom :',
    'Ville :',
    'Quartier :',
  ].join('\n')

  return (
    <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
      <div>
        <ul className="space-y-3">
          {lines.map((line) => (
            <li
              key={line.productId}
              className="flex gap-4 rounded-2xl border border-ink-100 p-3.5 sm:p-4"
            >
              <Link
                href={`/produits/${line.slug}`}
                className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 sm:size-24"
              >
                {line.image ? (
                  <Image src={line.image} alt={line.name} fill sizes="96px" className="object-cover" />
                ) : null}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/produits/${line.slug}`}
                  className="text-[0.9375rem] leading-snug font-semibold text-ink-900 hover:text-brand-600"
                >
                  {line.name}
                </Link>
                <span className="mt-1 text-sm text-ink-500">{formatPrice(line.price)} / unité</span>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                  <div className="flex h-10 items-center rounded-xl border border-ink-200">
                    <button
                      type="button"
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                      aria-label={`Diminuer la quantité de ${line.name}`}
                      className="grid h-full w-9 place-items-center text-ink-600 hover:text-brand-600"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="w-9 text-center text-sm font-bold">{line.quantity}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          line.productId,
                          Math.min(line.stock > 0 ? line.stock : 999, line.quantity + 1)
                        )
                      }
                      aria-label={`Augmenter la quantité de ${line.name}`}
                      className="grid h-full w-9 place-items-center text-ink-600 hover:text-brand-600"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>

                  <span className="font-display text-lg font-extrabold text-ink-900">
                    {formatPrice(line.price * line.quantity)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => remove(line.productId)}
                aria-label={`Retirer ${line.name} du panier`}
                className="grid size-9 shrink-0 place-items-center self-start rounded-lg text-ink-400 hover:bg-brand-50 hover:text-brand-600"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/produits"
            className="rounded-xl border border-ink-200 px-5 py-2.5 text-sm font-semibold text-ink-800 hover:border-ink-900"
          >
            Continuer mes achats
          </Link>
          <button
            type="button"
            onClick={() => clear()}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-ink-500 hover:text-brand-600"
          >
            Vider le panier
          </button>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-ink-100 p-6">
          <h2 className="text-lg font-bold text-ink-900">Récapitulatif</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Sous-total</dt>
              <dd className="font-semibold text-ink-900">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Livraison</dt>
              <dd className="text-right text-ink-600">Communiquée à la confirmation</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-ink-100 pt-5">
            <span className="font-bold text-ink-900">Total</span>
            <span className="font-display text-2xl font-extrabold text-brand-600">
              {formatPrice(subtotal)}
            </span>
          </div>

          <Link
            href="/commande"
            className="mt-6 flex h-12 items-center justify-center rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-white hover:bg-brand-700"
          >
            Passer la commande
          </Link>

          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2.5 flex h-12 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-[0.9375rem] font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              Commander via WhatsApp
            </a>
          )}

          <p className="mt-4 text-center text-xs text-ink-400">
            Aucun compte n’est nécessaire pour commander.
          </p>
        </div>
      </aside>
    </div>
  )
}
