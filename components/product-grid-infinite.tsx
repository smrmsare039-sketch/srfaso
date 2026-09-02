'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { loadMoreProducts } from '@/lib/actions/catalog'
import type { ProductFilters } from '@/lib/data'
import type { ProductWithRelations } from '@/lib/types'
import { formatNumber } from '@/lib/utils'

/**
 * Grille catalogue avec chargement automatique : la page suivante part dès que
 * le bas de la liste approche du viewport.
 */
export function ProductGridInfinite({
  initialProducts,
  total,
  pages,
  filters,
}: {
  initialProducts: ProductWithRelations[]
  total: number
  pages: number
  filters: ProductFilters
}) {
  const [products, setProducts] = useState(initialProducts)
  const [page, setPage] = useState(filters.page ?? 1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const sentinel = useRef<HTMLDivElement | null>(null)
  const busy = useRef(false)

  // Nouveau filtre / tri : on repart de la liste rendue par le serveur.
  useEffect(() => {
    setProducts(initialProducts)
    setPage(filters.page ?? 1)
    setError(false)
    busy.current = false
  }, [initialProducts, filters.page])

  const hasMore = page < pages

  const loadNext = useCallback(async () => {
    if (busy.current || !hasMore) return
    busy.current = true
    setLoading(true)
    setError(false)
    try {
      const next = page + 1
      const res = await loadMoreProducts(filters, next)
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id))
        return [...prev, ...res.products.filter((p) => !seen.has(p.id))]
      })
      setPage(next)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
      busy.current = false
    }
  }, [filters, hasMore, page])

  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasMore || error) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadNext()
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [error, hasMore, loadNext])

  return (
    <>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>

      <div ref={sentinel} aria-hidden className="h-px w-full" />

      <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
        {loading && (
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-500">
            <Loader2 className="size-4 animate-spin" />
            Chargement des produits…
          </span>
        )}

        {error && (
          <button
            type="button"
            onClick={() => void loadNext()}
            className="rounded-xl border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 hover:border-ink-900"
          >
            Le chargement a échoué — réessayer
          </button>
        )}

        {!loading && !error && hasMore && (
          <button
            type="button"
            onClick={() => void loadNext()}
            className="rounded-xl border border-ink-200 px-5 py-3 text-sm font-semibold text-ink-700 hover:border-ink-900"
          >
            Voir plus de produits
          </button>
        )}

        {!hasMore && products.length > 0 && (
          <span className="text-sm text-ink-400">
            {formatNumber(products.length)} produit{products.length > 1 ? 's' : ''} sur{' '}
            {formatNumber(total)} — fin du catalogue.
          </span>
        )}
      </div>
    </>
  )
}
