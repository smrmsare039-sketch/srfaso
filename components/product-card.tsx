'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ImageOff, Plus } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import type { ProductWithRelations } from '@/lib/types'
import { cx, discountPercent, formatPrice } from '@/lib/utils'

export function ProductCard({ product }: { product: ProductWithRelations }) {
  const { add } = useCart()
  const image = product.images?.[0]
  const discount = discountPercent(Number(product.price), Number(product.old_price))
  const inStock = product.stock > 0

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white transition-shadow hover:shadow-card">
      <Link href={`/produits/${product.slug}`} className="relative block aspect-square bg-ink-50">
        {image ? (
          <Image
            src={image.url}
            alt={image.alt ?? product.name}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 45vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="grid size-full place-items-center text-ink-300">
            <ImageOff className="size-10" strokeWidth={1.2} aria-hidden />
          </span>
        )}

        <span className="absolute top-2.5 left-2.5 flex flex-col items-start gap-1.5">
          {discount !== null && (
            <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-bold text-white">
              -{discount}%
            </span>
          )}
          {product.is_new && (
            <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[0.6875rem] font-bold text-white">
              Nouveau
            </span>
          )}
        </span>

        {!inStock && (
          <span className="absolute inset-x-0 bottom-0 bg-ink-900/85 py-1.5 text-center text-[0.6875rem] font-bold tracking-wide text-white uppercase">
            Rupture de stock
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3.5">
        {product.category && (
          <Link
            href={`/categories/${product.category.slug}`}
            className="text-[0.6875rem] font-semibold tracking-wide text-ink-400 uppercase transition-colors hover:text-brand-600"
          >
            {product.category.name}
          </Link>
        )}

        <h3 className="mt-1 text-[0.9375rem] leading-snug font-semibold text-ink-900">
          <Link href={`/produits/${product.slug}`} className="line-clamp-2-safe hover:text-brand-600">
            {product.name}
          </Link>
        </h3>

        <div className="mt-auto pt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-extrabold text-brand-600">
              {formatPrice(product.price)}
            </span>
            {product.old_price && Number(product.old_price) > Number(product.price) && (
              <span className="text-sm text-ink-400 line-through">
                {formatPrice(product.old_price)}
              </span>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={!inStock}
              onClick={() =>
                add({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: Number(product.price),
                  image: image?.url ?? null,
                  stock: product.stock,
                })
              }
              className={cx(
                'flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold transition-colors',
                inStock
                  ? 'bg-brand-600 text-white hover:bg-brand-700'
                  : 'cursor-not-allowed bg-ink-100 text-ink-400'
              )}
            >
              <Plus className="size-4" aria-hidden />
              Panier
            </button>
            <Link
              href={`/produits/${product.slug}`}
              className="grid h-10 shrink-0 place-items-center rounded-xl border border-ink-200 px-3.5 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900"
            >
              Détails
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
