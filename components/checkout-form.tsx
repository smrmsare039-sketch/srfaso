'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useToast } from '@/components/toast'
import { createOrder } from '@/lib/actions/public'
import { formatPrice, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-base text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500 sm:text-[0.9375rem]'
const label = 'mb-1.5 block text-sm font-semibold text-ink-800'

export type AccountDefaults = { fullName: string; email: string; phone: string }

export function CheckoutForm({
  whatsapp,
  account,
}: {
  whatsapp: string | null
  account?: AccountDefaults | null
}) {
  const { lines, ready, subtotal, clear } = useCart()
  const toast = useToast()

  // « Prénom Nom » : le premier mot sert de prénom, le reste de nom.
  const nameParts = (account?.fullName ?? '').trim().split(/\s+/).filter(Boolean)
  const defaultFirstName = nameParts[0] ?? ''
  const defaultLastName = nameParts.slice(1).join(' ')
  const [pending, startTransition] = useTransition()
  const [reference, setReference] = useState<string | null>(null)
  const [orderedLines, setOrderedLines] = useState<typeof lines>([])
  const [orderedTotal, setOrderedTotal] = useState(0)

  useEffect(() => {
    if (reference) window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [reference])

  if (reference) {
    const waMessage = [
      `Bonjour, je viens de passer la commande ${reference} sur srfaso.com :`,
      '',
      ...orderedLines.map((l) => `${l.quantity} × ${l.name}`),
      '',
      `Total : ${formatPrice(orderedTotal)}`,
    ].join('\n')

    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-green-200 bg-green-50 p-6 text-center sm:p-12">
        <CheckCircle2 className="mx-auto size-14 text-green-600" strokeWidth={1.4} />
        <h2 className="mt-5 text-2xl font-extrabold text-green-900">Commande enregistrée !</h2>
        <p className="mt-3 text-green-800">
          Votre numéro de commande est{' '}
          <strong className="font-extrabold">{reference}</strong>. Notre équipe vous contacte sur
          WhatsApp pour confirmer les articles, les frais de livraison et le délai.
        </p>
        <p className="mt-4 font-display text-3xl font-extrabold text-green-900">
          {formatPrice(orderedTotal)}
        </p>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          {whatsapp && (
            <a
              href={whatsappLink(whatsapp, waMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-[0.9375rem] font-bold text-white"
            >
              <WhatsAppIcon className="size-5" />
              Envoyer sur WhatsApp
            </a>
          )}
          <Link
            href={`/suivi?ref=${encodeURIComponent(reference)}`}
            className="inline-flex items-center justify-center rounded-xl border border-green-300 px-6 py-3 text-[0.9375rem] font-bold text-green-800 transition-colors hover:border-green-600"
          >
            Suivre ma commande
          </Link>
          <Link
            href="/produits"
            className="rounded-xl border border-green-300 px-6 py-3 text-[0.9375rem] font-semibold text-green-900"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    )
  }

  if (!ready) return <div className="h-72 animate-pulse rounded-2xl bg-ink-50" />

  if (lines.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-ink-200 py-14 text-center sm:py-20">
        <ShoppingBag className="mx-auto size-12 text-ink-300" strokeWidth={1.2} />
        <p className="mt-4 text-lg font-bold text-ink-900">Votre panier est vide.</p>
        <Link
          href="/produits"
          className="mt-7 inline-block rounded-xl bg-brand-600 px-7 py-3 text-[0.9375rem] font-bold text-ink-900 hover:bg-brand-700"
        >
          Voir les produits
        </Link>
      </div>
    )
  }

  return (
    <form
      action={(formData) => {
        const snapshot = lines
        const total = subtotal
        startTransition(async () => {
          const result = await createOrder(formData, snapshot)
          if (result.ok && result.data) {
            setOrderedLines(snapshot)
            setOrderedTotal(total)
            setReference(result.data.reference)
            // Vidage technique : la confirmation de commande fait office de retour.
            clear({ silent: true })
            toast.success('Commande enregistrée', {
              key: 'commande',
              description: `Votre numéro de commande est ${result.data.reference}. Nous vous contactons sur WhatsApp.`,
            })
          } else if (!result.ok) {
            toast.error('Commande non enregistrée', {
              key: 'commande',
              description: result.error,
            })
          }
        })
      }}
      className="grid gap-5 lg:grid-cols-[1.5fr_1fr] lg:gap-8"
    >
      {/* Mobile : récapitulatif replié en tête, pour voir le panier avant de saisir. */}
      <details className="rounded-2xl border border-ink-100 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
          <span className="text-sm font-semibold text-ink-900">
            {lines.length} article{lines.length > 1 ? 's' : ''} — voir le détail
          </span>
          <span className="font-display text-lg font-extrabold whitespace-nowrap text-brand-800">
            {formatPrice(subtotal)}
          </span>
        </summary>
        <ul className="space-y-3 border-t border-ink-100 p-4">
          {lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3">
              <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                {l.image ? (
                  <Image src={l.image} alt="" fill sizes="44px" className="object-cover" />
                ) : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-900">{l.name}</span>
                <span className="block text-xs text-ink-400">
                  {l.quantity} × {formatPrice(l.price)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-ink-900">
                {formatPrice(l.price * l.quantity)}
              </span>
            </li>
          ))}
        </ul>
      </details>

      <div className="rounded-2xl border border-ink-100 p-4 sm:p-8">
        <h2 className="text-lg font-bold text-ink-900">Vos coordonnées</h2>
        <p className="mt-1.5 mb-6 text-sm text-ink-500">
          {account
            ? 'Vos informations de compte sont pré-remplies : corrigez-les si besoin.'
            : 'Aucun compte n’est nécessaire. Nous avons seulement besoin de quoi vous joindre et vous livrer.'}
        </p>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="last_name" className={label}>
                Nom <span className="text-brand-800">*</span>
              </label>
              <input
                id="last_name"
                name="last_name"
                required
                autoComplete="family-name"
                enterKeyHint="next"
                maxLength={80}
                defaultValue={defaultLastName}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="first_name" className={label}>
                Prénom <span className="text-brand-800">*</span>
              </label>
              <input
                id="first_name"
                name="first_name"
                required
                autoComplete="given-name"
                enterKeyHint="next"
                maxLength={80}
                defaultValue={defaultFirstName}
                className={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className={label}>
              Numéro WhatsApp <span className="text-brand-800">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              inputMode="tel"
              autoComplete="tel"
              enterKeyHint="next"
              placeholder="+226 70 00 00 00"
              defaultValue={account?.phone ?? ''}
              className={field}
            />
            <p className="mt-1.5 text-xs text-ink-400">
              C’est sur ce numéro que nous confirmons la commande.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={label}>
                Ville <span className="text-brand-800">*</span>
              </label>
              <input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                maxLength={80}
                placeholder="Ouagadougou"
                className={field}
              />
            </div>
            <div>
              <label htmlFor="district" className={label}>
                Quartier / adresse <span className="font-normal text-ink-400">(facultatif)</span>
              </label>
              <input
                id="district"
                name="district"
                autoComplete="address-line1"
                maxLength={160}
                className={field}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className={label}>
              E-mail <span className="font-normal text-ink-400">(facultatif)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              defaultValue={account?.email ?? ''}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="notes" className={label}>
              Observations <span className="font-normal text-ink-400">(facultatif)</span>
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              maxLength={1000}
              placeholder="Modèle de moto, précisions sur la pièce, point de repère pour la livraison…"
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[0.9375rem] outline-none focus:border-brand-500"
            />
          </div>
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-ink-100 p-4 sm:p-6">
          <h2 className="hidden text-lg font-bold text-ink-900 lg:block">Votre commande</h2>

          <ul className="mt-5 hidden space-y-3 lg:block">
            {lines.map((l) => (
              <li key={l.productId} className="flex items-center gap-3">
                <span className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                  {l.image ? (
                    <Image src={l.image} alt="" fill sizes="48px" className="object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-900">{l.name}</span>
                  <span className="block text-xs text-ink-400">
                    {l.quantity} × {formatPrice(l.price)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-ink-900">
                  {formatPrice(l.price * l.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-baseline justify-between border-b border-ink-100 pb-4 lg:mt-5 lg:border-t lg:border-b-0 lg:pt-5 lg:pb-0">
            <span className="font-bold text-ink-900">Total</span>
            <span className="font-display text-2xl font-extrabold text-brand-800">
              {formatPrice(subtotal)}
            </span>
          </div>
          <p className="mt-2 text-xs text-ink-400">
            Les frais de livraison sont confirmés par notre équipe avant expédition.
          </p>

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex h-13 w-full items-center justify-center rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-ink-900 transition-colors hover:bg-brand-700 disabled:opacity-60 sm:h-12"
          >
            {pending ? 'Envoi…' : 'Valider ma commande'}
          </button>

          <Link
            href="/panier"
            className="mt-2.5 flex h-11 w-full items-center justify-center rounded-xl border border-ink-200 text-sm font-semibold text-ink-700 hover:border-ink-900"
          >
            Modifier le panier
          </Link>
        </div>
      </aside>
    </form>
  )
}
