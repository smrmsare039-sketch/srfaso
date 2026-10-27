'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { CategoryIcon } from '@/components/category-icon'
import type { Category } from '@/lib/types'
import { formatNumber } from '@/lib/utils'

/** Vitesse du défilement automatique, en pixels par seconde. */
const SPEED = 30
/** Délai avant la reprise du défilement après une interaction. */
const RESUME_DELAY = 2500

/**
 * Catégories sur une seule ligne : défilement libre (doigt, molette, clavier)
 * et défilement automatique lent, mis en pause pendant toute interaction.
 * La liste est doublée pour boucler sans saut visible.
 */
export function CategoryCarousel({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Record<string, number>
}) {
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = scroller.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let raf = 0
    let last = 0
    let paused = false
    let resumeTimer: ReturnType<typeof setTimeout> | undefined
    // scrollLeft est arrondi par certains navigateurs : on garde la position exacte à part.
    let pos = el.scrollLeft
    // Largeur d'un tour complet : distance entre une carte et sa copie.
    const period = () => {
      const copy = el.querySelector<HTMLElement>('[data-copy]')
      const first = el.querySelector<HTMLElement>('li')
      return copy && first ? copy.offsetLeft - first.offsetLeft : el.scrollWidth / 2
    }

    const tick = (now: number) => {
      const dt = last ? Math.min(now - last, 100) : 0
      last = now
      if (!paused) {
        const loop = period()
        pos += (SPEED * dt) / 1000
        if (pos >= loop) pos -= loop
        el.scrollLeft = pos
      }
      raf = requestAnimationFrame(tick)
    }

    const pause = () => {
      paused = true
      clearTimeout(resumeTimer)
    }
    const resumeSoon = () => {
      clearTimeout(resumeTimer)
      resumeTimer = setTimeout(() => {
        const loop = period()
        pos = el.scrollLeft >= loop ? el.scrollLeft - loop : el.scrollLeft
        paused = false
      }, RESUME_DELAY)
    }
    const nudge = () => {
      pause()
      resumeSoon()
    }

    el.addEventListener('pointerenter', pause)
    el.addEventListener('pointerleave', resumeSoon)
    el.addEventListener('touchstart', pause, { passive: true })
    el.addEventListener('touchend', resumeSoon)
    el.addEventListener('wheel', nudge, { passive: true })
    el.addEventListener('focusin', pause)
    el.addEventListener('focusout', resumeSoon)
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resumeTimer)
      el.removeEventListener('pointerenter', pause)
      el.removeEventListener('pointerleave', resumeSoon)
      el.removeEventListener('touchstart', pause)
      el.removeEventListener('touchend', resumeSoon)
      el.removeEventListener('wheel', nudge)
      el.removeEventListener('focusin', pause)
      el.removeEventListener('focusout', resumeSoon)
    }
  }, [])

  const renderItem = (c: Category, copy: boolean) => (
    <li
      key={`${copy ? 'copy-' : ''}${c.id}`}
      aria-hidden={copy || undefined}
      data-copy={copy || undefined}
      className="w-36 shrink-0 sm:w-44"
    >
      <Link
        href={`/categories/${c.slug}`}
        tabIndex={copy ? -1 : undefined}
        className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-ink-100 p-5 text-center transition-all hover:border-brand-200 hover:bg-brand-50/40"
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-ink-50 text-ink-800 transition-colors group-hover:bg-brand-600 group-hover:text-ink-900">
          <CategoryIcon name={c.icon} className="size-7" />
        </span>
        <span className="text-sm leading-snug font-semibold text-ink-900">{c.name}</span>
        {counts[c.id] ? (
          <span className="text-xs text-ink-400">
            {formatNumber(counts[c.id])} produit{counts[c.id] > 1 ? 's' : ''}
          </span>
        ) : null}
      </Link>
    </li>
  )

  return (
    <div ref={scroller} className="no-scrollbar overflow-x-auto overscroll-x-contain">
      <ul className="flex w-max gap-3">
        {categories.map((c) => renderItem(c, false))}
        {categories.map((c) => renderItem(c, true))}
      </ul>
    </div>
  )
}
