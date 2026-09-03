'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { ChevronRight } from 'lucide-react'
import type { HomePromo, ProductWithRelations } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

type Remaining = { days: number; hours: number; minutes: number; seconds: number }

function remainingFrom(endsAt: number): Remaining | null {
  const diff = endsAt - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  }
}

// Horloge partagée : une seconde = un rendu, sans état local ni effet.
let tick = 0
function subscribeToSeconds(onChange: () => void) {
  const timer = setInterval(() => {
    tick += 1
    onChange()
  }, 1000)
  return () => clearInterval(timer)
}

/**
 * Compte à rebours. Rien n'est affiché au rendu serveur : le serveur et le
 * navigateur n'ont pas la même horloge, et un premier rendu identique des deux
 * côtés évite l'erreur d'hydratation.
 */
function Countdown({ endsAt }: { endsAt: string }) {
  const target = new Date(endsAt).getTime()
  const clientTick = useSyncExternalStore(
    subscribeToSeconds,
    () => tick,
    () => null
  )

  const remaining = clientTick === null || Number.isNaN(target) ? null : remainingFrom(target)
  if (!remaining) return null

  const cells = [
    { value: remaining.days, label: 'Jours' },
    { value: remaining.hours, label: 'Hr' },
    { value: remaining.minutes, label: 'Min' },
    { value: remaining.seconds, label: 'Sec' },
  ]

  return (
    <ul className="mt-8 flex gap-6" aria-label="Temps restant">
      {cells.map((cell) => (
        <li key={cell.label}>
          <span className="block font-display text-2xl font-extrabold text-ink-900 tabular-nums">
            {String(cell.value).padStart(2, '0')}
          </span>
          <span className="block text-xs text-ink-400">{cell.label}</span>
        </li>
      ))}
    </ul>
  )
}

export function HomePromoSection({
  promo,
  products,
}: {
  promo: HomePromo
  products: ProductWithRelations[]
}) {
  return (
    <section className="container-page py-8">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-ink-50 via-white to-brand-50 p-5 sm:p-8">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          {promo.image_url && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-white p-3">
              {/* object-contain : le visuel est vu en entier, jamais rogné. */}
              <Image
                src={promo.image_url}
                alt={promo.title ?? 'Offre du moment'}
                fill
                sizes="(min-width:1024px) 45vw, 100vw"
                className="rounded-lg object-contain"
              />
            </div>
          )}

          <div>
            {promo.eyebrow && (
              <p className="text-xs font-bold tracking-[0.18em] text-brand-800 uppercase">
                {promo.eyebrow}
              </p>
            )}
            {promo.title && (
              <h2 className="mt-2 font-display text-2xl leading-tight font-extrabold text-ink-900 sm:text-3xl">
                {promo.title}
              </h2>
            )}
            {promo.description && (
              <p className="mt-4 max-w-xl leading-relaxed text-ink-500">{promo.description}</p>
            )}

            {promo.ends_at && <Countdown endsAt={promo.ends_at} />}

            {promo.cta_href && (
              <Link
                href={promo.cta_href}
                className="mt-8 inline-flex h-11 items-center gap-1.5 rounded-lg bg-brand-600 px-5 text-sm font-bold text-ink-900 transition-colors hover:bg-brand-700"
              >
                {promo.cta_label ?? 'Commander maintenant'}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            )}
          </div>
        </div>

        {products.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {products.map((product) => {
              const image = product.images?.[0]
              const oldPrice = Number(product.old_price ?? 0)
              return (
                <li key={product.id}>
                  <Link
                    href={`/produits/${product.slug}`}
                    className="flex h-full items-center gap-3 rounded-2xl border border-ink-100 bg-white p-3 transition-colors hover:border-brand-200"
                  >
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {image && (
                        <Image
                          src={image.url}
                          alt={image.alt ?? product.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {product.name}
                      </span>
                      <span className="mt-1 block text-xs">
                        {oldPrice > Number(product.price) && (
                          <span className="mr-1.5 text-ink-400 line-through">
                            {formatPrice(oldPrice)}
                          </span>
                        )}
                        <span className="font-bold text-brand-800">
                          {formatPrice(product.price)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
