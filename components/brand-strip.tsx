'use client'

import Image from 'next/image'
import { useState } from 'react'
import type { PartnerBrand } from '@/lib/types'

function BrandLogo({ brand }: { brand: PartnerBrand }) {
  const [failed, setFailed] = useState(false)

  if (!brand.logo_url || failed) {
    return (
      <span className="font-display text-lg font-black tracking-tight text-ink-400 uppercase">
        {brand.name}
      </span>
    )
  }

  return (
    <Image
      src={brand.logo_url}
      alt={brand.name}
      width={200}
      height={96}
      loading="lazy"
      onError={() => setFailed(true)}
      className="h-14 w-auto object-contain sm:h-16"
    />
  )
}

export function BrandStrip({ brands }: { brands: PartnerBrand[] }) {
  if (brands.length === 0) return null

  return (
    <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-8 sm:gap-x-16">
      {brands.map((brand) => (
        <li
          key={brand.id}
          title={brand.name}
          className="grid h-16 place-items-center opacity-90 transition-opacity hover:opacity-100 sm:h-20"
        >
          {brand.website_url ? (
            <a
              href={brand.website_url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="grid h-full place-items-center"
            >
              <BrandLogo brand={brand} />
            </a>
          ) : (
            <BrandLogo brand={brand} />
          )}
        </li>
      ))}
    </ul>
  )
}
