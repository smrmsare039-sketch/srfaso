import type { Metadata } from 'next'
import { PackageSearch } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { Pagination } from '@/components/pagination'
import { ProductCard } from '@/components/product-card'
import { ProductFilters } from '@/components/product-filters'
import { SortSelect } from '@/components/sort-select'
import {
  getBrands,
  getCategories,
  getCategoryCounts,
  getProducts,
  type ProductFilters as Filters,
} from '@/lib/data'
import { formatNumber } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Produits — pièces détachées et accessoires moto',
  description:
    'Tout le catalogue SUPER & RESISTANT : moteur, transmission, électricité, éclairage, pneus, huiles et accessoires moto. Disponible à Ouagadougou, livré au Burkina Faso.',
  alternates: { canonical: '/produits' },
}

function toNumber(value: string | undefined): number | undefined {
  if (!value) return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

export default async function ProductsPage(props: PageProps<'/produits'>) {
  const sp = await props.searchParams
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const [categories, brands, counts] = await Promise.all([
    getCategories(),
    getBrands(),
    getCategoryCounts(),
  ])

  const categorySlug = get('categorie')
  const category = categories.find((c) => c.slug === categorySlug)
  const childIds = category
    ? [category.id, ...categories.filter((c) => c.parent_id === category.id).map((c) => c.id)]
    : undefined

  const filters: Filters = {
    q: get('q'),
    categoryIds: childIds,
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
  const query = get('q')

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Produits' }]} />

      <header className="mb-8">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          {query ? `Résultats pour « ${query} »` : 'Nos produits'}
        </h1>
        <p className="mt-2 text-ink-500">
          {formatNumber(total)} produit{total > 1 ? 's' : ''}
          {category ? ` dans « ${category.name} »` : ''} — pièces détachées et accessoires moto
          disponibles au Burkina Faso.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <ProductFilters categories={categories} brands={brands} counts={counts} />

        <div className="min-w-0 flex-1">
          <div className="mb-5 flex items-center justify-between gap-3">
            <span className="hidden text-sm text-ink-500 lg:block">
              Page {page} sur {pages}
            </span>
            <SortSelect />
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-ink-200 py-20 text-center">
              <PackageSearch className="mx-auto size-10 text-ink-300" strokeWidth={1.3} />
              <p className="mt-4 font-semibold text-ink-900">Aucun produit ne correspond.</p>
              <p className="mt-1 text-sm text-ink-500">
                Modifiez vos filtres ou contactez-nous : nous pouvons commander la pièce pour vous.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          <Pagination page={page} pages={pages} basePath="/produits" searchParams={plainParams} />
        </div>
      </div>
    </div>
  )
}
