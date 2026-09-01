import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { PackageSearch } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CategoryIcon } from '@/components/category-icon'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import { SortSelect } from '@/components/sort-select'
import {
  getBrands,
  getCategories,
  getCategoryBySlug,
  getProducts,
  type ProductFilters as Filters,
} from '@/lib/data'
import { formatNumber, truncate } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata(
  props: PageProps<'/categories/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const category = await getCategoryBySlug(slug)
  if (!category) return { title: 'Catégorie introuvable' }

  const title = category.seo_title ?? `${category.name} — pièces moto au Burkina Faso`
  const description =
    category.seo_description ??
    truncate(
      category.description ??
        `${category.name} : retrouvez notre sélection chez SUPER & RESISTANT à Ouagadougou, livrée partout au Burkina Faso.`,
      160
    )

  return {
    title,
    description,
    alternates: { canonical: `/categories/${category.slug}` },
    openGraph: {
      title,
      description,
      url: `/categories/${category.slug}`,
      images: category.image_url ? [{ url: category.image_url }] : undefined,
    },
  }
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export default async function CategoryPage(props: PageProps<'/categories/[slug]'>) {
  const [{ slug }, sp] = await Promise.all([props.params, props.searchParams])
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const [category, allCategories, brands] = await Promise.all([
    getCategoryBySlug(slug),
    getCategories(),
    getBrands(),
  ])
  if (!category) notFound()

  const children = allCategories.filter((c) => c.parent_id === category.id)
  const categoryIds = [category.id, ...children.map((c) => c.id)]

  const filters: Filters = {
    categoryIds,
    brand: get('marque'),
    minPrice: toNumber(get('prix_min')),
    maxPrice: toNumber(get('prix_max')),
    inStock: get('stock') === '1',
    promo: get('promo') === '1',
    isNew: get('nouveautes') === '1',
    sort: (get('tri') as Filters['sort']) ?? 'pertinence',
    page: toNumber(get('page')) ?? 1,
    perPage: 12,
  }

  const { products, total, page, pages } = await getProducts(filters)

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <div className="container-page pb-16">
      <Breadcrumbs
        items={[
          { label: 'Catégories', href: '/categories' },
          { label: category.name },
        ]}
      />

      <header className="mb-10 overflow-hidden rounded-3xl border border-ink-100">
        <div className="grid md:grid-cols-[1.4fr_1fr]">
          <div className="p-7 sm:p-10">
            <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
              <CategoryIcon name={category.icon} className="size-6" />
            </span>
            <h1 className="mt-4 text-3xl font-extrabold text-ink-900 sm:text-4xl">
              {category.name}
            </h1>
            {category.description && (
              <p className="mt-3 max-w-xl leading-relaxed text-ink-500">{category.description}</p>
            )}
            <p className="mt-4 text-sm font-semibold text-ink-700">
              {formatNumber(total)} produit{total > 1 ? 's' : ''} disponible
              {total > 1 ? 's' : ''}
            </p>
          </div>
          {category.image_url && (
            <div className="relative min-h-48">
              <Image
                src={category.image_url}
                alt={category.image_alt ?? category.name}
                fill
                sizes="(min-width:768px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          )}
        </div>
      </header>

      {children.length > 0 && (
        <ul className="mb-8 flex flex-wrap gap-2">
          {children.map((c) => (
            <li key={c.id}>
              <a
                href={`/categories/${c.slug}`}
                className="rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-500 hover:text-brand-600"
              >
                {c.name}
              </a>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <Suspense fallback={<div className="hidden w-64 shrink-0 lg:block" />}>
          <ProductFilters
            categories={allCategories}
            brands={brands}
            lockedCategory={category.slug}
          />
        </Suspense>

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="hidden text-sm text-ink-500 lg:block">
              Page {page} sur {pages}
            </span>
            <Suspense fallback={null}>
              <SortSelect />
            </Suspense>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 py-20 text-center">
              <PackageSearch className="mx-auto size-10 text-ink-300" strokeWidth={1.3} />
              <p className="mt-4 font-semibold text-ink-900">
                Aucun produit dans cette catégorie pour le moment.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination
            page={page}
            pages={pages}
            basePath={`/categories/${category.slug}`}
            searchParams={plainParams}
          />
        </div>
      </div>

      <section className="mt-16 max-w-3xl">
        <h2 className="text-2xl font-extrabold text-ink-900">
          {category.name} au Burkina Faso
        </h2>
        <div className="prose-sr mt-3">
          <p>
            {category.description ??
              `Retrouvez notre sélection ${category.name.toLowerCase()} chez SUPER & RESISTANT.`}{' '}
            Les articles de cette catégorie sont disponibles dans nos boutiques de Ouagadougou —
            Rue 7.07 à Samandin et au Marché du cycle — et livrés à Bobo-Dioulasso ainsi que dans
            les autres villes du Burkina Faso.
          </p>
          <p>
            Vous ne trouvez pas la référence recherchée ? Contactez notre équipe par téléphone ou
            sur WhatsApp : nous vérifions la disponibilité et pouvons commander la pièce pour vous.
          </p>
        </div>
      </section>
    </div>
  )
}
