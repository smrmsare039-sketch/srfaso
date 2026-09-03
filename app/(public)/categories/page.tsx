import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CategoryIcon } from '@/components/category-icon'
import { getCategoryCounts, getRootCategories } from '@/lib/data'
import { formatNumber } from '@/lib/utils'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Catégories de pièces et accessoires moto',
  description:
    'Parcourez les catégories SUPER & RESISTANT : moteur, transmission, embrayage, électricité, éclairage, compteurs, injection, refroidissement, freinage, pneus, huiles et accessoires.',
  alternates: { canonical: '/categories' },
}

export default async function CategoriesPage() {
  const [categories, counts] = await Promise.all([getRootCategories(), getCategoryCounts()])

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Catégories' }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          Toutes les catégories
        </h1>
        <p className="mt-3 text-ink-500">
          Le catalogue de SUPER &amp; RESISTANT est organisé par famille de pièces afin de trouver
          rapidement la référence adaptée à votre moto.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 py-16 text-center text-ink-500">
          Les catégories seront affichées dès leur création dans le back-office.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 transition-shadow hover:shadow-card"
              >
                <span className="relative block aspect-[16/9] bg-ink-50">
                  {c.image_url ? (
                    <Image
                      src={c.image_url}
                      alt={c.image_alt ?? c.name}
                      fill
                      sizes="(min-width:1024px) 30vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-ink-300">
                      <CategoryIcon name={c.icon} className="size-14" />
                    </span>
                  )}
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <span className="flex items-center gap-2.5">
                    <CategoryIcon name={c.icon} className="size-5 text-brand-800" />
                    <span className="text-lg font-bold text-ink-900">{c.name}</span>
                  </span>
                  {c.description && (
                    <span className="mt-2 text-sm leading-relaxed text-ink-500">
                      {c.description}
                    </span>
                  )}
                  <span className="mt-4 flex items-center justify-between pt-1 text-sm font-semibold text-brand-800">
                    Consulter
                    <span className="flex items-center gap-2">
                      {counts[c.id] ? (
                        <span className="font-normal text-ink-400">
                          {formatNumber(counts[c.id])} produit{counts[c.id] > 1 ? 's' : ''}
                        </span>
                      ) : null}
                      <ArrowRight className="size-4" aria-hidden />
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
