'use client'

import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftRight, ChevronLeft, ChevronRight, Phone, X, ZoomIn } from 'lucide-react'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import type { WorkshopPhotoWithService } from '@/lib/types'
import { cx, telLink, whatsappLink } from '@/lib/utils'

/**
 * Galerie de l'atelier : preuve par l'image avant la demande de rendez-vous.
 *
 * Trois partis pris de conversion :
 *  1. les légendes restent lisibles sans survol (l'essentiel du trafic est
 *     tactile) ;
 *  2. chaque photo agrandie propose immédiatement WhatsApp et l'appel, avec un
 *     message pré-rempli reprenant la prestation montrée ;
 *  3. les filtres par prestation laissent le visiteur retrouver son cas précis.
 */
export function WorkshopGallery({
  photos,
  whatsapp,
  phone,
}: {
  photos: WorkshopPhotoWithService[]
  whatsapp: string | null
  phone: string | null
}) {
  const [filter, setFilter] = useState<string>('all')
  const [index, setIndex] = useState<number | null>(null)
  const [showBefore, setShowBefore] = useState(false)
  const touchStart = useRef<number | null>(null)

  const services = useMemo(() => {
    const map = new Map<string, { id: string; title: string; count: number }>()
    for (const photo of photos) {
      if (!photo.service) continue
      const entry = map.get(photo.service.id)
      if (entry) entry.count += 1
      else map.set(photo.service.id, { id: photo.service.id, title: photo.service.title, count: 1 })
    }
    return [...map.values()].sort((a, b) => b.count - a.count)
  }, [photos])

  const visible = useMemo(
    () => (filter === 'all' ? photos : photos.filter((p) => p.service?.id === filter)),
    [photos, filter]
  )

  const current = index === null ? null : (visible[index] ?? null)

  const close = useCallback(() => setIndex(null), [])
  const go = useCallback(
    (step: number) => {
      setShowBefore(false)
      setIndex((i) => (i === null ? null : (i + step + visible.length) % visible.length))
    },
    [visible.length]
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowRight') go(1)
      if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [index, close, go])

  if (photos.length === 0) return null

  const label = (photo: WorkshopPhotoWithService) =>
    photo.title ?? photo.service?.title ?? 'Intervention à l’atelier'

  const message = (photo: WorkshopPhotoWithService) =>
    `Bonjour SUPER & RESISTANT, j’ai vu « ${label(photo)} » dans votre galerie. Je souhaite un rendez-vous à l’atelier.`

  return (
    <section aria-labelledby="galerie-atelier" className="mt-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.18em] text-brand-600 uppercase">
            L’atelier en images
          </p>
          <h2 id="galerie-atelier" className="mt-2 text-2xl font-extrabold text-ink-900 sm:text-3xl">
            Nos interventions, photo à l’appui
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-500">
            Toutes ces photos viennent de notre atelier de Ouagadougou. Repérez un cas proche du
            vôtre et demandez un rendez-vous en un message.
          </p>
        </div>
        <p className="text-sm font-semibold text-ink-400">
          {photos.length} intervention{photos.length > 1 ? 's' : ''} en images
        </p>
      </div>

      {services.length > 1 && (
        <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
            Tout voir ({photos.length})
          </Chip>
          {services.map((service) => (
            <Chip
              key={service.id}
              active={filter === service.id}
              onClick={() => setFilter(service.id)}
            >
              {service.title} ({service.count})
            </Chip>
          ))}
        </div>
      )}

      <ul className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((photo, i) => (
          <li
            key={photo.id}
            className={cx(
              'group relative overflow-hidden rounded-2xl bg-ink-100',
              // La première photo occupe quatre cases : elle porte le regard.
              i === 0 && 'md:col-span-2 md:row-span-2'
            )}
          >
            <button
              type="button"
              onClick={() => {
                setShowBefore(false)
                setIndex(i)
              }}
              className="block w-full cursor-zoom-in"
              aria-label={`Agrandir : ${label(photo)}`}
            >
              <span className="relative block aspect-square">
                <Image
                  src={photo.image_url}
                  alt={label(photo)}
                  fill
                  sizes={i === 0 ? '(min-width:768px) 50vw, 50vw' : '(min-width:1024px) 25vw, 50vw'}
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                />
              </span>

              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-transparent p-3 text-left sm:p-4">
                <span className="block truncate text-sm font-bold text-white">{label(photo)}</span>
                {photo.service && (
                  <span className="mt-0.5 block truncate text-xs text-white/70">
                    {photo.service.title}
                  </span>
                )}
              </span>

              {photo.before_url && (
                <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[0.6875rem] font-bold text-ink-900">
                  <ArrowLeftRight className="size-3" aria-hidden />
                  Avant / Après
                </span>
              )}

              <span className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-white/90 text-ink-900 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                <ZoomIn className="size-4" aria-hidden />
              </span>
            </button>
          </li>
        ))}
      </ul>

      {/* Visionneuse */}
      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label(current)}
          className="fixed inset-0 z-[80] flex flex-col bg-ink-950/95 backdrop-blur-sm"
          onTouchStart={(e) => {
            touchStart.current = e.touches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchStart.current === null) return
            const delta = e.changedTouches[0].clientX - touchStart.current
            if (Math.abs(delta) > 60) go(delta > 0 ? -1 : 1)
            touchStart.current = null
          }}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-semibold text-white/70">
              {(index ?? 0) + 1} / {visible.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Fermer"
              className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            {visible.length > 1 && (
              <>
                <NavButton side="left" onClick={() => go(-1)} />
                <NavButton side="right" onClick={() => go(1)} />
              </>
            )}

            <div className="relative h-full w-full max-w-4xl">
              <Image
                key={showBefore ? current.before_url : current.image_url}
                src={(showBefore ? current.before_url : current.image_url) ?? current.image_url}
                alt={label(current)}
                fill
                sizes="(min-width:1024px) 60vw, 100vw"
                className="object-contain"
                priority
              />
              {current.before_url && (
                <span className="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-ink-950/80 px-3 py-1 text-xs font-bold text-white">
                  {showBefore ? 'Avant' : 'Après'}
                </span>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 bg-ink-950/80 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-3xl">
              <p className="text-base font-bold text-white">{label(current)}</p>
              {current.caption && (
                <p className="mt-1 text-sm leading-relaxed text-white/70">{current.caption}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {current.before_url && (
                  <button
                    type="button"
                    onClick={() => setShowBefore((v) => !v)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-bold text-white hover:bg-white/10"
                  >
                    <ArrowLeftRight className="size-4" aria-hidden />
                    Voir {showBefore ? 'l’après' : 'l’avant'}
                  </button>
                )}
                {whatsapp && (
                  <a
                    href={whatsappLink(whatsapp, message(current))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-5 text-sm font-bold text-white sm:flex-none"
                  >
                    <WhatsAppIcon className="size-4" />
                    Demander ce service
                  </a>
                )}
                {phone && (
                  <a
                    href={telLink(phone)}
                    className="inline-flex h-11 items-center gap-2 rounded-lg bg-white px-5 text-sm font-bold text-ink-900"
                  >
                    <Phone className="size-4" aria-hidden />
                    Appeler l’atelier
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cx(
        'h-10 shrink-0 rounded-full border px-4 text-sm font-semibold whitespace-nowrap transition-colors',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-ink-200 bg-white text-ink-700 hover:border-ink-900'
      )}
    >
      {children}
    </button>
  )
}

function NavButton({ side, onClick }: { side: 'left' | 'right'; onClick: () => void }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === 'left' ? 'Photo précédente' : 'Photo suivante'}
      className={cx(
        'absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/25',
        side === 'left' ? 'left-2 sm:left-4' : 'right-2 sm:right-4'
      )}
    >
      <Icon className="size-6" />
    </button>
  )
}
