'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart-provider'

export function CartButton() {
  const { count, ready } = useCart()

  return (
    <Link
      href="/panier"
      className="group relative grid size-12 shrink-0 place-items-center rounded-full border border-ink-200 transition-colors hover:border-brand-500"
      aria-label={`Panier, ${count} article${count > 1 ? 's' : ''}`}
    >
      <span className="relative grid size-8 place-items-center">
        <ShoppingCart className="size-6 text-ink-900" strokeWidth={1.7} aria-hidden />
        {ready && count > 0 && (
          <span className="absolute -top-1 -right-1.5 grid min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </span>
    </Link>
  )
}
