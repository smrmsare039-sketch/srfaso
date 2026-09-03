'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'
import type { Category } from '@/lib/types'
import { cx } from '@/lib/utils'

type Props = {
  categories: Category[]
  brands: string[]
  counts?: Record<string, number>
  /** Catégorie imposée par la page (fiche catégorie) : le filtre est masqué. */
  lockedCategory?: string
}

export function ProductFilters({ categories, brands, counts, lockedCategory }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [openMobile, setOpenMobile] = useState(false)

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString())
      if (value === null || value === '') next.delete(key)
      else next.set(key, value)
      next.delete('page')
      router.push(`${pathname}?${next.toString()}`, { scroll: false })
    },
    [params, pathname, router]
  )

  const activeCategory = params.get('categorie')
  const activeBrand = params.get('marque')
  const min = params.get('prix_min') ?? ''
  const max = params.get('prix_max') ?? ''
  const inStock = params.get('stock') === '1'
  const promo = params.get('promo') === '1'
  const isNew = params.get('nouveautes') === '1'

  const activeCount = [
    !lockedCategory && activeCategory,
    activeBrand,
    min,
    max,
    inStock,
    promo,
    isNew,
  ].filter(Boolean).length

  const body = (
    <div className="space-y-7">
      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink-200 py-2.5 text-sm font-semibold text-ink-700 hover:border-brand-500 hover:text-brand-900"
        >
          <X className="size-4" aria-hidden />
          Réinitialiser les filtres ({activeCount})
        </button>
      )}

      {!lockedCategory && categories.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-ink-900">Catégorie</legend>
          <ul className="scroll-thin max-h-72 space-y-0.5 overflow-y-auto pr-1">
            <li>
              <button
                type="button"
                onClick={() => setParam('categorie', null)}
                className={cx(
                  'w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                  !activeCategory ? 'bg-brand-50 font-semibold text-brand-800' : 'hover:bg-ink-50'
                )}
              >
                Toutes les catégories
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setParam('categorie', c.slug)}
                  className={cx(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors',
                    activeCategory === c.slug
                      ? 'bg-brand-50 font-semibold text-brand-800'
                      : 'hover:bg-ink-50'
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  {counts?.[c.id] ? (
                    <span className="shrink-0 text-xs text-ink-400">{counts[c.id]}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </fieldset>
      )}

      {brands.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-bold text-ink-900">Marque</legend>
          <select
            value={activeBrand ?? ''}
            onChange={(e) => setParam('marque', e.target.value || null)}
            className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Toutes les marques</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-3 text-sm font-bold text-ink-900">Prix (FCFA)</legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={min}
            placeholder="Min"
            onBlur={(e) => setParam('prix_min', e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
          <span className="text-ink-300">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={max}
            placeholder="Max"
            onBlur={(e) => setParam('prix_max', e.target.value)}
            className="h-11 w-full rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-2.5">
        <legend className="mb-3 text-sm font-bold text-ink-900">Disponibilité</legend>
        {[
          { key: 'stock', label: 'En stock uniquement', checked: inStock },
          { key: 'promo', label: 'En promotion', checked: promo },
          { key: 'nouveautes', label: 'Nouveautés', checked: isNew },
        ].map((item) => (
          <label
            key={item.key}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700"
          >
            <input
              type="checkbox"
              checked={item.checked}
              onChange={(e) => setParam(item.key, e.target.checked ? '1' : null)}
              className="size-4 rounded border-ink-300 accent-brand-600"
            />
            {item.label}
          </label>
        ))}
      </fieldset>
    </div>
  )

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-800"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>

      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-6 rounded-2xl border border-ink-100 p-4">{body}</div>
      </aside>

      {openMobile && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fermer les filtres"
            onClick={() => setOpenMobile(false)}
            className="absolute inset-0 bg-ink-950/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filtres</h2>
              <button
                type="button"
                onClick={() => setOpenMobile(false)}
                aria-label="Fermer"
                className="grid size-10 place-items-center rounded-full hover:bg-ink-50"
              >
                <X className="size-5" />
              </button>
            </div>
            {body}
            <button
              type="button"
              onClick={() => setOpenMobile(false)}
              className="mt-6 h-12 w-full rounded-xl bg-brand-600 font-bold text-ink-900"
            >
              Voir les résultats
            </button>
          </div>
        </div>
      )}
    </>
  )
}
