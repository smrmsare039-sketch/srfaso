'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Menu, X } from 'lucide-react'
import { CategoryIcon } from '@/components/category-icon'
import type { Category } from '@/lib/types'
import { cx } from '@/lib/utils'

/**
 * Rail de catégories réduit, présent sur toutes les pages publiques.
 * Il s'ouvre au survol (souris) et au clic sur le bouton menu (tactile).
 */
export function CategoryRail({ categories }: { categories: Category[] }) {
  const [hovered, setHovered] = useState(false)
  const [pinned, setPinned] = useState(false)
  const pathname = usePathname()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const open = hovered || pinned

  // Refermeture du rail au changement de page, ajustée pendant le rendu.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    if (pinned) setPinned(false)
    if (hovered) setHovered(false)
  }

  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pinned])

  const openNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setHovered(true)
  }
  const closeSoon = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setHovered(false), 120)
  }

  return (
    <>
      {pinned && (
        <button
          type="button"
          aria-label="Fermer le menu des catégories"
          onClick={() => setPinned(false)}
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
        />
      )}

      {/* Mobile : pas de rail permanent, seulement son bouton burger. */}
      {!pinned && (
        <button
          type="button"
          onClick={() => setPinned(true)}
          aria-label="Toutes les catégories"
          aria-expanded={false}
          className="fixed bottom-5 left-4 z-40 flex items-center gap-2 rounded-full bg-brand-600 py-3 pr-5 pl-3 font-semibold text-white shadow-pop transition-transform hover:scale-105 lg:hidden"
        >
          <Menu className="size-6 shrink-0" />
          <span className="text-sm">Catégories</span>
        </button>
      )}

      <nav
        aria-label="Catégories de produits"
        onMouseEnter={openNow}
        onMouseLeave={closeSoon}
        style={{ '--rail-w': open ? 'var(--rail-expanded)' : 'var(--rail-width)' } as CSSProperties}
        className={cx(
          'fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-ink-100 bg-white',
          // Mobile : tiroir hors écran tant que le burger n'a pas été touché.
          'w-[min(20rem,86vw)] transition-transform duration-200 ease-out',
          pinned ? 'translate-x-0' : '-translate-x-full',
          // Desktop : rail permanent qui s'élargit au survol.
          'lg:w-[var(--rail-w)] lg:translate-x-0 lg:transition-[width]',
          open && 'shadow-pop'
        )}
      >
        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-ink-100 px-3">
          <button
            type="button"
            onClick={() => setPinned((v) => !v)}
            aria-expanded={open}
            aria-label={pinned ? 'Fermer les catégories' : 'Toutes les catégories'}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition-colors hover:bg-brand-700"
          >
            {pinned ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span
            className={cx(
              'truncate text-sm font-bold whitespace-nowrap text-ink-900 uppercase',
              !open && 'pointer-events-none opacity-0'
            )}
          >
            Toutes les catégories
          </span>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto overscroll-contain py-2">
          {categories.map((category) => {
            const href = `/categories/${category.slug}`
            const active = pathname === href
            return (
              <Link
                key={category.id}
                href={href}
                title={category.name}
                className={cx(
                  'group flex h-12 items-center gap-3 px-3 transition-colors',
                  active ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'
                )}
              >
                <span
                  className={cx(
                    'grid size-11 shrink-0 place-items-center rounded-xl transition-colors',
                    active ? 'bg-brand-50' : 'group-hover:bg-ink-50'
                  )}
                >
                  <CategoryIcon name={category.icon} className="size-[1.375rem]" />
                </span>
                <span
                  className={cx(
                    'truncate text-[0.9375rem] font-medium whitespace-nowrap',
                    !open && 'pointer-events-none opacity-0'
                  )}
                >
                  {category.name}
                </span>
              </Link>
            )
          })}
        </div>

        <div className="shrink-0 border-t border-ink-100 p-3">
          <Link
            href="/categories"
            className={cx(
              'flex h-11 items-center gap-3 rounded-xl bg-ink-900 px-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600',
              !open && 'justify-center px-0'
            )}
          >
            <Menu className="size-5 shrink-0" />
            <span className={cx('whitespace-nowrap', !open && 'hidden')}>
              Voir toutes les catégories
            </span>
          </Link>
        </div>
      </nav>
    </>
  )
}
