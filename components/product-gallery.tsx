'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import type { ProductImage } from '@/lib/types'
import { cx } from '@/lib/utils'

export function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[]
  productName: string
}) {
  const [active, setActive] = useState(0)
  const current = images[active]

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
        {current ? (
          <Image
            src={current.url}
            alt={current.alt ?? productName}
            fill
            priority
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="grid size-full place-items-center text-ink-300">
            <ImageOff className="size-12" strokeWidth={1.2} aria-hidden />
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 gap-2.5">
          {images.slice(0, 10).map((img, i) => (
            <li key={img.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Image ${i + 1} de ${productName}`}
                className={cx(
                  'relative block aspect-square w-full overflow-hidden rounded-xl border-2 bg-ink-50 transition-colors',
                  i === active ? 'border-brand-600' : 'border-ink-100 hover:border-ink-300'
                )}
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? `${productName} — vue ${i + 1}`}
                  fill
                  sizes="90px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
