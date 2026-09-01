'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Search, Tag } from 'lucide-react'
import { cx, formatPrice } from '@/lib/utils'

type Suggestion = {
  id: string
  name: string
  slug: string
  reference: string | null
  price: number
  image_url: string | null
  category_name: string | null
}

type CategorySuggestion = { id: string; name: string; slug: string }

export function SearchBox({ className }: { className?: string }) {
  const router = useRouter()
  const [term, setTerm] = useState('')
  const [products, setProducts] = useState<Suggestion[]>([])
  const [categories, setCategories] = useState<CategorySuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    const query = term.trim()
    // Le panneau de suggestions n'est affiché qu'à partir de 2 caractères :
    // inutile de vider l'état, il n'est plus lu.
    if (query.length < 2) return

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        const data = await res.json()
        setProducts(data.products ?? [])
        setCategories(data.categories ?? [])
        setOpen(true)
      } catch {
        // requête annulée ou hors ligne
      } finally {
        setLoading(false)
      }
    }, 220)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const query = term.trim()
    if (!query) return
    setOpen(false)
    router.push(`/produits?q=${encodeURIComponent(query)}`)
  }

  const hasResults = products.length > 0 || categories.length > 0

  return (
    <div ref={boxRef} className={cx('relative', className)}>
      <form onSubmit={submit} role="search">
        <label htmlFor={listId} className="sr-only">
          Rechercher des produits
        </label>
        <div className="flex h-12 items-center overflow-hidden rounded-lg border border-ink-200 bg-white transition-colors focus-within:border-brand-500">
          <input
            id={listId}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => hasResults && setOpen(true)}
            onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
            placeholder="Rechercher des produits"
            autoComplete="off"
            className="h-full min-w-0 flex-1 bg-transparent pr-3 pl-4 text-[0.9375rem] text-ink-900 outline-none placeholder:text-ink-400"
          />
          {loading && <Loader2 className="mr-2 size-4 animate-spin text-ink-400" aria-hidden />}
          <button
            type="submit"
            aria-label="Rechercher"
            className="grid h-full w-12 shrink-0 place-items-center bg-brand-600 text-white transition-colors hover:bg-brand-700"
          >
            <Search className="size-5" aria-hidden />
          </button>
        </div>
      </form>

      {open && term.trim().length >= 2 && (
        <div className="scroll-thin absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 max-h-[70vh] overflow-y-auto rounded-2xl border border-ink-100 bg-white p-2 shadow-pop">
          {!hasResults && !loading && (
            <p className="px-3 py-6 text-center text-sm text-ink-500">
              Aucun résultat pour « {term.trim()} ».
            </p>
          )}

          {categories.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pt-2 pb-1 text-[0.6875rem] font-semibold tracking-wider text-ink-400 uppercase">
                Catégories
              </p>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/categories/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-700 hover:bg-ink-50"
                >
                  <Tag className="size-4 text-brand-600" aria-hidden />
                  {c.name}
                </Link>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div>
              <p className="px-3 pt-2 pb-1 text-[0.6875rem] font-semibold tracking-wider text-ink-400 uppercase">
                Produits
              </p>
              {products.map((p) => (
                <Link
                  key={p.id}
                  href={`/produits/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-ink-50"
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                    {p.image_url ? (
                      <Image
                        src={p.image_url}
                        alt={p.name}
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-900">
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-ink-400">
                      {p.category_name ?? p.reference ?? ''}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-brand-600">
                    {formatPrice(p.price)}
                  </span>
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  router.push(`/produits?q=${encodeURIComponent(term.trim())}`)
                }}
                className="mt-1 w-full rounded-xl px-3 py-2.5 text-center text-sm font-semibold text-brand-600 hover:bg-brand-50"
              >
                Voir tous les résultats
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
