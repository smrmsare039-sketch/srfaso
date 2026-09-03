import Image from 'next/image'
import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { AdminFilterSelect, AdminSearch } from '@/components/admin/admin-search'
import { ProductRowActions } from '@/components/admin/product-row-actions'
import { Badge, Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { Pagination } from '@/components/pagination'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { formatNumber, formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminProductsPage(props: PageProps<'/admin/produits'>) {
  await requireAdmin()
  const sp = await props.searchParams
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const supabase = await createSupabaseServerClient()
  const page = Math.max(1, Number(get('page') ?? 1) || 1)
  const search = get('q')?.trim()
  const categoryId = get('categorie')
  const stockFilter = get('stock')
  const statusFilter = get('statut')

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
    .order('position')

  let query = supabase
    .from('products')
    .select(
      'id,name,slug,reference,price,old_price,stock,is_active,is_featured,is_promo,is_new,category:categories!products_category_id_fkey(name),images:product_images(url,position,is_primary)',
      { count: 'exact' }
    )

  if (search) query = query.or(`name.ilike.%${search}%,reference.ilike.%${search}%`)
  if (categoryId) query = query.eq('category_id', categoryId)
  if (stockFilter === 'rupture') query = query.lte('stock', 0)
  if (stockFilter === 'faible') query = query.gt('stock', 0).lte('stock', 5)
  if (statusFilter === 'actif') query = query.eq('is_active', true)
  if (statusFilter === 'inactif') query = query.eq('is_active', false)

  const from = (page - 1) * PER_PAGE
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  type Row = {
    id: string
    name: string
    slug: string
    reference: string | null
    price: number
    old_price: number | null
    stock: number
    is_active: boolean
    is_featured: boolean
    is_promo: boolean
    is_new: boolean
    category: { name: string } | null
    images: { url: string; position: number; is_primary: boolean }[]
  }

  const products = (data as Row[] | null) ?? []
  const total = count ?? products.length
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <>
      <PageHeader
        title="Produits"
        description={`${formatNumber(total)} produit${total > 1 ? 's' : ''} au catalogue.`}
        action={
          <Link
            href="/admin/produits/nouveau"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-ink-900 hover:bg-brand-700"
          >
            <Plus className="size-4" />
            Nouveau produit
          </Link>
        }
      />

      <Card className="mb-4">
        <Suspense fallback={<div className="h-11" />}>
          <div className="flex flex-wrap gap-3">
            <AdminSearch placeholder="Nom ou référence…" />
            <AdminFilterSelect
              name="categorie"
              allLabel="Toutes les catégories"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
            />
            <AdminFilterSelect
              name="stock"
              allLabel="Tous les stocks"
              options={[
                { value: 'rupture', label: 'En rupture' },
                { value: 'faible', label: 'Stock faible (≤ 5)' },
              ]}
            />
            <AdminFilterSelect
              name="statut"
              allLabel="Tous les statuts"
              options={[
                { value: 'actif', label: 'Actifs' },
                { value: 'inactif', label: 'Inactifs' },
              ]}
            />
          </div>
        </Suspense>
      </Card>

      {products.length === 0 ? (
        <EmptyState
          title="Aucun produit."
          description="Créez votre premier produit avec le bouton « Nouveau produit »."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[60rem] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs tracking-wider whitespace-nowrap text-ink-500 uppercase">
                  <th className="px-4 py-3 font-semibold">Produit</th>
                  <th className="px-4 py-3 font-semibold">Catégorie</th>
                  <th className="px-4 py-3 text-right font-semibold">Prix</th>
                  <th className="px-4 py-3 text-center font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">État</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const image = [...(p.images ?? [])].sort(
                    (a, b) =>
                      Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
                  )[0]
                  return (
                    <tr key={p.id} className="border-b border-ink-50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="relative size-11 shrink-0 overflow-hidden rounded-lg border border-ink-100 bg-ink-50">
                            {image ? (
                              <Image
                                src={image.url}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : null}
                          </span>
                          <span className="min-w-0">
                            <Link
                              href={`/admin/produits/${p.id}`}
                              className="block max-w-xs truncate font-semibold text-ink-900 hover:text-brand-900"
                            >
                              {p.name}
                            </Link>
                            {p.reference && (
                              <span className="block text-xs text-ink-400">{p.reference}</span>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-ink-600">
                        {p.category?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <span className="font-semibold text-ink-900">{formatPrice(p.price)}</span>
                        {p.old_price && Number(p.old_price) > Number(p.price) && (
                          <span className="block text-xs text-ink-400 line-through">
                            {formatPrice(p.old_price)}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={
                            p.stock <= 0
                              ? 'font-bold text-brand-800'
                              : p.stock <= 5
                                ? 'font-bold text-amber-600'
                                : 'font-semibold text-ink-800'
                          }
                        >
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-nowrap gap-1 whitespace-nowrap">
                          <Badge tone={p.is_active ? 'success' : 'muted'}>
                            {p.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                          {p.is_featured && <Badge tone="brand">Vedette</Badge>}
                          {p.is_promo && <Badge tone="warning">Promo</Badge>}
                          {p.is_new && <Badge tone="info">Nouveau</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ProductRowActions
                          id={p.id}
                          slug={p.slug}
                          name={p.name}
                          isActive={p.is_active}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        basePath="/admin/produits"
        searchParams={plainParams}
      />
    </>
  )
}
