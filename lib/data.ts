import 'server-only'

import { cache } from 'react'
import { createSupabasePublicClient } from '@/lib/supabase/public'
import { HERO_TILES_MAX, HOME_PROMO_PRODUCTS_MAX } from '@/lib/types'
import type {
  Category,
  DeliveryContent,
  HeroTile,
  HomePromo,
  PartnerBrand,
  ProductWithRelations,
  Service,
  Shop,
  SiteSettings,
  WorkshopPhotoWithService,
} from '@/lib/types'

const PRODUCT_SELECT =
  '*, category:categories!products_category_id_fkey(id,name,slug), images:product_images(id,product_id,url,alt,position,is_primary)'

function sortImages<T extends { images?: { position: number; is_primary: boolean }[] }>(
  row: T
): T {
  if (Array.isArray(row.images)) {
    row.images.sort(
      (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
    )
  }
  return row
}

/** La colonne jsonb peut contenir n'importe quoi : on ne garde que les entrées exploitables. */
function normalizeHeroTiles(value: unknown): HeroTile[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map((t) => ({
      url: typeof t.url === 'string' ? t.url : '',
      label: typeof t.label === 'string' && t.label ? t.label : null,
      href: typeof t.href === 'string' && t.href ? t.href : null,
    }))
    .filter((t) => t.url)
    .slice(0, HERO_TILES_MAX)
}

export const DEFAULT_SETTINGS: SiteSettings = {
  id: 1,
  company_name: 'SUPER & RESISTANT',
  tagline: 'Pièces détachées, accessoires et mécanique moto au Burkina Faso',
  logo_url: null,
  favicon_url: null,
  phone_primary: '+226 60 00 22 20',
  phone_secondary: '+226 78 47 40 44',
  whatsapp: '+22660002220',
  whatsapp_message: 'Bonjour SUPER & RESISTANT, je souhaite avoir des informations concernant ',
  email: 'contact@srfaso.com',
  address: 'Rue 7.07, Samandin, Ouagadougou',
  hours: 'Lundi – Samedi : 07h30 – 19h00',
  delivery_title: 'Livraison',
  delivery_text: 'Partout au Faso',
  facebook_url: null,
  tiktok_url: null,
  instagram_url: null,
  youtube_url: null,
  seo_title: 'Pièces détachées moto au Burkina Faso | SR Faso',
  seo_description:
    'SUPER & RESISTANT (SR Faso) : pièces détachées moto, accessoires et services de mécanique à Ouagadougou, Bobo-Dioulasso et partout au Burkina Faso.',
  seo_keywords: null,
  og_image_url: null,
  home_hero_title: 'Toutes les pièces de votre moto, au même endroit',
  home_hero_subtitle:
    'Moteur, transmission, électricité, éclairage, pneus, huiles et accessoires. Disponibles en boutique à Ouagadougou et livrés partout au Burkina Faso.',
  home_hero_image: null,
  home_hero_video: null,
  home_hero_bg: 'brand',
  home_hero_tiles: [],
  home_brands_title: 'Nos marques partenaires — avec SUPER & RESISTANT en référence',
  home_brands_intro:
    'Nous sélectionnons des marques reconnues pour leur fiabilité et leurs performances afin de garantir des pièces moto durables et adaptées aux réalités du terrain. SUPER & RESISTANT, notre marque principale, incarne cet engagement avec des produits robustes, testés et pensés pour les motards exigeants. À ses côtés, nous proposons également des références majeures du marché comme Honda, Suzuki et Yamaha pour offrir un choix complet, sûr et professionnel.',
  home_seo_content: null,
}

export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()
    if (!data) return DEFAULT_SETTINGS
    return {
      ...DEFAULT_SETTINGS,
      ...data,
      home_hero_tiles: normalizeHeroTiles(data.home_hero_tiles),
      home_hero_bg: data.home_hero_bg === 'dark' ? 'dark' : 'brand',
    }
  } catch {
    return DEFAULT_SETTINGS
  }
})

export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    return (data as Category[]) ?? []
  } catch {
    return []
  }
})

export const getRootCategories = cache(async (): Promise<Category[]> => {
  const all = await getCategories()
  return all.filter((c) => !c.parent_id)
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const supabase = createSupabasePublicClient()
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  return (data as Category) ?? null
})

export const getCategoryCounts = cache(async (): Promise<Record<string, number>> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('products')
      .select('category_id')
      .eq('is_active', true)
      .limit(10000)
    const counts: Record<string, number> = {}
    for (const row of (data as { category_id: string | null }[]) ?? []) {
      if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
    }
    return counts
  } catch {
    return {}
  }
})

export type ProductFilters = {
  q?: string
  category?: string
  categoryIds?: string[]
  brand?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  promo?: boolean
  isNew?: boolean
  sort?: 'pertinence' | 'nouveautes' | 'prix-asc' | 'prix-desc' | 'populaires'
  page?: number
  perPage?: number
}

export async function getProducts(filters: ProductFilters = {}): Promise<{
  products: ProductWithRelations[]
  total: number
  page: number
  perPage: number
  pages: number
}> {
  const page = Math.max(1, filters.page ?? 1)
  const perPage = Math.min(60, Math.max(1, filters.perPage ?? 12))

  try {
    const supabase = createSupabasePublicClient()
    let query = supabase
      .from('products')
      .select(PRODUCT_SELECT, { count: 'exact' })
      .eq('is_active', true)

    if (filters.categoryIds?.length) query = query.in('category_id', filters.categoryIds)
    if (filters.brand) query = query.eq('brand', filters.brand)
    if (typeof filters.minPrice === 'number') query = query.gte('price', filters.minPrice)
    if (typeof filters.maxPrice === 'number') query = query.lte('price', filters.maxPrice)
    if (filters.inStock) query = query.gt('stock', 0)
    if (filters.promo) query = query.eq('is_promo', true)
    if (filters.isNew) query = query.eq('is_new', true)
    if (filters.q) {
      const term = filters.q.replace(/[%,()]/g, ' ').trim()
      if (term) query = query.ilike('search_text', `%${term}%`)
    }

    switch (filters.sort) {
      case 'prix-asc':
        query = query.order('price', { ascending: true })
        break
      case 'prix-desc':
        query = query.order('price', { ascending: false })
        break
      case 'nouveautes':
        query = query.order('created_at', { ascending: false })
        break
      case 'populaires':
        query = query.order('sales_count', { ascending: false }).order('views', {
          ascending: false,
        })
        break
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: false })
    }

    const from = (page - 1) * perPage
    const { data, count } = await query.range(from, from + perPage - 1)
    const products = ((data as ProductWithRelations[]) ?? []).map(sortImages)
    const total = count ?? products.length

    return { products, total, page, perPage, pages: Math.max(1, Math.ceil(total / perPage)) }
  } catch {
    return { products: [], total: 0, page, perPage, pages: 1 }
  }
}

export const getProductBySlug = cache(
  async (slug: string): Promise<ProductWithRelations | null> => {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle()
    return data ? sortImages(data as ProductWithRelations) : null
  }
)

export async function getRelatedProducts(
  product: ProductWithRelations,
  limit = 8
): Promise<ProductWithRelations[]> {
  try {
    const supabase = createSupabasePublicClient()
    let query = supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .neq('id', product.id)
      .limit(limit)

    if (product.category_id) query = query.eq('category_id', product.category_id)
    else if (product.brand) query = query.eq('brand', product.brand)

    const { data } = await query
    const rows = ((data as ProductWithRelations[]) ?? []).map(sortImages)
    if (rows.length >= 4 || !product.brand) return rows

    const { data: byBrand } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('brand', product.brand)
      .neq('id', product.id)
      .limit(limit)
    const extra = ((byBrand as ProductWithRelations[]) ?? []).map(sortImages)
    const seen = new Set(rows.map((r) => r.id))
    return [...rows, ...extra.filter((r) => !seen.has(r.id))].slice(0, limit)
  } catch {
    return []
  }
}

async function getProductsFlag(
  column: 'is_featured' | 'is_new' | 'is_promo',
  limit: number
): Promise<ProductWithRelations[]> {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq(column, true)
      .order('created_at', { ascending: false })
      .limit(limit)
    return ((data as ProductWithRelations[]) ?? []).map(sortImages)
  } catch {
    return []
  }
}

export const getFeaturedProducts = cache((limit = 8) => getProductsFlag('is_featured', limit))
export const getNewProducts = cache((limit = 8) => getProductsFlag('is_new', limit))
export const getPromoProducts = cache((limit = 8) => getProductsFlag('is_promo', limit))

export const getPopularProducts = cache(async (limit = 8): Promise<ProductWithRelations[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('sales_count', { ascending: false })
      .order('views', { ascending: false })
      .limit(limit)
    return ((data as ProductWithRelations[]) ?? []).map(sortImages)
  } catch {
    return []
  }
})

export const getBrands = cache(async (): Promise<string[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('products')
      .select('brand')
      .eq('is_active', true)
      .not('brand', 'is', null)
      .limit(5000)
    const set = new Set<string>()
    for (const row of (data as { brand: string | null }[]) ?? []) {
      if (row.brand) set.add(row.brand)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'))
  } catch {
    return []
  }
})

export const getShops = cache(async (): Promise<Shop[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
    return (data as Shop[]) ?? []
  } catch {
    return []
  }
})

export const getServices = cache(async (): Promise<Service[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
    return (data as Service[]) ?? []
  } catch {
    return []
  }
})

export const getPartnerBrands = cache(async (): Promise<PartnerBrand[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('partner_brands')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('name', { ascending: true })
    return (data as PartnerBrand[]) ?? []
  } catch {
    return []
  }
})

export const getHomePromo = cache(async (): Promise<HomePromo | null> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase.from('home_promo').select('*').eq('id', 1).maybeSingle()
    if (!data) return null
    const row = data as HomePromo & { product_ids: unknown }
    return {
      ...row,
      product_ids: Array.isArray(row.product_ids)
        ? row.product_ids.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return null
  }
})

/** Produits de la section promo, dans l'ordre choisi au back-office. */
export const getHomePromoProducts = cache(
  async (ids: string[]): Promise<ProductWithRelations[]> => {
    if (ids.length === 0) return []
    try {
      const supabase = createSupabasePublicClient()
      const { data } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .in('id', ids.slice(0, HOME_PROMO_PRODUCTS_MAX))
        .eq('is_active', true)
      const rows = ((data as ProductWithRelations[]) ?? []).map(sortImages)
      // L'ordre du back-office fait foi, pas celui renvoyé par la base.
      return ids
        .map((id) => rows.find((p) => p.id === id))
        .filter((p): p is ProductWithRelations => Boolean(p))
    } catch {
      return []
    }
  }
)

export const getWorkshopGallery = cache(async (): Promise<WorkshopPhotoWithService[]> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('workshop_gallery')
      .select('*, service:services(id,title,slug)')
      .eq('is_active', true)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    return (data as WorkshopPhotoWithService[]) ?? []
  } catch {
    return []
  }
})

export const getDeliveryContent = cache(async (): Promise<DeliveryContent | null> => {
  try {
    const supabase = createSupabasePublicClient()
    const { data } = await supabase
      .from('delivery_content')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    return (data as DeliveryContent) ?? null
  } catch {
    return null
  }
})
