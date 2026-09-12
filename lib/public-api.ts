import 'server-only'

import { NextResponse } from 'next/server'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import type { Category, ProductImage, ProductWithRelations, Spec } from '@/lib/types'

/**
 * API publique en lecture seule destinée aux applications tierces.
 * Si PUBLIC_API_KEYS est défini (clés séparées par des virgules), une clé
 * est exigée via l'en-tête `x-api-key` ou `Authorization: Bearer <clé>`.
 */

export const API_MAX_PER_PAGE = 100

const API_PRODUCT_SELECT =
  '*, category:categories!products_category_id_fkey(id,name,slug), subcategory:categories!products_subcategory_id_fkey(id,name,slug), images:product_images(id,product_id,url,alt,position,is_primary)'

type CategoryRef = Pick<Category, 'id' | 'name' | 'slug'>

type ApiProductRow = ProductWithRelations & { subcategory: CategoryRef | null }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
  'Access-Control-Max-Age': '86400',
}

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      ...CORS_HEADERS,
      'Cache-Control':
        status === 200 ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
    },
  })
}

export function apiError(status: number, code: string, message: string) {
  return apiJson({ error: { code, message } }, status)
}

export function apiPreflight() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

/** Renvoie une réponse d'erreur si la clé est requise et absente/invalide. */
export function checkApiKey(request: Request): NextResponse | null {
  const keys = (process.env.PUBLIC_API_KEYS ?? '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  if (keys.length === 0) return null

  const bearer = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1]
  const provided = request.headers.get('x-api-key') ?? bearer
  if (provided && keys.includes(provided.trim())) return null
  return apiError(401, 'unauthorized', 'Clé API manquante ou invalide.')
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://srfaso.com').replace(/\/+$/, '')
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toApiImage(image: ProductImage) {
  return {
    id: image.id,
    url: image.url,
    alt: image.alt,
    position: image.position,
    is_primary: image.is_primary,
  }
}

export function toApiProduct(row: ApiProductRow) {
  const images = [...(row.images ?? [])]
    .sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position)
    .map(toApiImage)
  const price = toNumber(row.price) ?? 0
  const oldPrice = toNumber(row.old_price)
  const specifications: Spec[] = Array.isArray(row.specifications) ? row.specifications : []

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    reference: row.reference,
    brand: row.brand,
    url: `${siteUrl()}/produits/${row.slug}`,
    price,
    old_price: oldPrice,
    currency: 'XOF',
    discount_percent:
      oldPrice && oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : null,
    stock: row.stock,
    in_stock: row.stock > 0,
    short_description: row.short_description,
    description: row.description,
    specifications,
    compatibility: row.compatibility ?? [],
    keywords: row.keywords ?? [],
    category: row.category,
    subcategory: row.subcategory,
    images,
    image_url: images[0]?.url ?? null,
    is_featured: row.is_featured,
    is_new: row.is_new,
    is_promo: row.is_promo,
    sales_count: row.sales_count,
    seo_title: row.seo_title,
    seo_description: row.seo_description,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

export type ApiProduct = ReturnType<typeof toApiProduct>

const SORTS = ['recent', 'updated', 'name', 'price-asc', 'price-desc', 'popular'] as const
type ApiSort = (typeof SORTS)[number]

export type ApiProductQuery = {
  q?: string
  category?: string
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  promo?: boolean
  isNew?: boolean
  featured?: boolean
  updatedSince?: string
  ids?: string[]
  sort: ApiSort
  page: number
  perPage: number
}

function parseBool(value: string | null): boolean | undefined {
  if (value === null) return undefined
  return ['1', 'true', 'yes', 'oui'].includes(value.toLowerCase())
}

function parseNum(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined
  const n = Number(value)
  return Number.isFinite(n) ? n : undefined
}

/** Valide les paramètres d'URL ; renvoie un message d'erreur si invalide. */
export function parseProductQuery(
  params: URLSearchParams
): { query: ApiProductQuery } | { error: string } {
  const sort = (params.get('sort') ?? 'recent') as ApiSort
  if (!SORTS.includes(sort)) return { error: `sort doit valoir : ${SORTS.join(', ')}.` }

  const page = parseNum(params.get('page')) ?? 1
  const perPage = parseNum(params.get('per_page')) ?? 20
  if (!Number.isInteger(page) || page < 1) return { error: 'page doit être un entier >= 1.' }
  if (!Number.isInteger(perPage) || perPage < 1 || perPage > API_MAX_PER_PAGE) {
    return { error: `per_page doit être un entier entre 1 et ${API_MAX_PER_PAGE}.` }
  }

  const updatedSince = params.get('updated_since') ?? undefined
  if (updatedSince && Number.isNaN(Date.parse(updatedSince))) {
    return { error: 'updated_since doit être une date ISO 8601.' }
  }

  const ids = params.get('ids')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  return {
    query: {
      q: params.get('q')?.trim() || undefined,
      category: params.get('category')?.trim() || undefined,
      brand: params.get('brand')?.trim() || undefined,
      minPrice: parseNum(params.get('min_price')),
      maxPrice: parseNum(params.get('max_price')),
      inStock: parseBool(params.get('in_stock')),
      promo: parseBool(params.get('promo')),
      isNew: parseBool(params.get('new')),
      featured: parseBool(params.get('featured')),
      updatedSince: updatedSince ? new Date(updatedSince).toISOString() : undefined,
      ids: ids?.length ? ids.slice(0, API_MAX_PER_PAGE) : undefined,
      sort,
      page,
      perPage,
    },
  }
}

/** Identifiants de la catégorie (par slug) et de ses sous-catégories. */
async function resolveCategoryIds(slug: string): Promise<string[]> {
  const supabase = createSupabasePublicClient()
  const { data } = await supabase
    .from('categories')
    .select('id,parent_id,slug')
    .eq('is_active', true)
  const rows = (data as Pick<Category, 'id' | 'parent_id' | 'slug'>[]) ?? []
  const root = rows.find((c) => c.slug === slug)
  if (!root) return []

  const ids = new Set([root.id])
  let added = true
  while (added) {
    added = false
    for (const c of rows) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id)
        added = true
      }
    }
  }
  return [...ids]
}

export async function listApiProducts(q: ApiProductQuery) {
  const supabase = createSupabasePublicClient()
  let query = supabase
    .from('products')
    .select(API_PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)

  if (q.category) {
    const categoryIds = await resolveCategoryIds(q.category)
    if (categoryIds.length === 0) return { products: [], total: 0 }
    const list = categoryIds.join(',')
    query = query.or(`category_id.in.(${list}),subcategory_id.in.(${list})`)
  }
  if (q.ids) query = query.in('id', q.ids)
  if (q.brand) query = query.ilike('brand', q.brand.replace(/[%_]/g, '\\$&'))
  if (q.minPrice !== undefined) query = query.gte('price', q.minPrice)
  if (q.maxPrice !== undefined) query = query.lte('price', q.maxPrice)
  if (q.inStock !== undefined) query = q.inStock ? query.gt('stock', 0) : query.lte('stock', 0)
  if (q.promo !== undefined) query = query.eq('is_promo', q.promo)
  if (q.isNew !== undefined) query = query.eq('is_new', q.isNew)
  if (q.featured !== undefined) query = query.eq('is_featured', q.featured)
  if (q.updatedSince) query = query.gte('updated_at', q.updatedSince)
  if (q.q) {
    const term = q.q.replace(/[%,()]/g, ' ').trim()
    if (term) query = query.ilike('search_text', `%${term}%`)
  }

  switch (q.sort) {
    case 'updated':
      query = query.order('updated_at', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending: true })
      break
    case 'price-asc':
      query = query.order('price', { ascending: true })
      break
    case 'price-desc':
      query = query.order('price', { ascending: false })
      break
    case 'popular':
      query = query.order('sales_count', { ascending: false })
      break
    default:
      query = query.order('created_at', { ascending: false })
  }
  // Départage stable pour une pagination sans doublons ni trous.
  query = query.order('id', { ascending: true })

  const from = (q.page - 1) * q.perPage
  const { data, count, error } = await query.range(from, from + q.perPage - 1)
  if (error) throw error

  const products = ((data as ApiProductRow[] | null) ?? []).map(toApiProduct)
  return { products, total: count ?? products.length }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Produit actif par identifiant (uuid) ou par slug. */
export async function getApiProduct(idOrSlug: string): Promise<ApiProduct | null> {
  const supabase = createSupabasePublicClient()
  const { data, error } = await supabase
    .from('products')
    .select(API_PRODUCT_SELECT)
    .eq(UUID_RE.test(idOrSlug) ? 'id' : 'slug', idOrSlug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data ? toApiProduct(data as ApiProductRow) : null
}
