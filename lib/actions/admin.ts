'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentProfile } from '@/lib/auth'
import { slugify } from '@/lib/utils'
import { HERO_BACKGROUND_VALUES, HERO_TILES_MAX, HOME_PROMO_PRODUCTS_MAX } from '@/lib/types'
import type { HeroBackground, HeroTile, MessageStatus, OrderStatus, Spec } from '@/lib/types'

export type AdminResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

async function guard() {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Accès refusé.')
  return profile
}

function str(form: FormData, key: string, max = 500): string {
  const value = form.get(key)
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function num(form: FormData, key: string): number | null {
  const value = str(form, key, 30).replace(',', '.')
  if (!value) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function bool(form: FormData, key: string): boolean {
  return form.get(key) === 'on' || form.get(key) === 'true'
}

function list(form: FormData, key: string): string[] {
  return str(form, key, 4000)
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function specs(form: FormData): Spec[] {
  // Une caractéristique par ligne : "Libellé : valeur"
  return str(form, 'specifications', 6000)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx === -1) return { label: line, value: '' }
      return { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() }
    })
    .filter((s) => s.label)
}

function heroTiles(form: FormData): HeroTile[] {
  // Une tuile par index : hero_tile_1_image / _label / _href
  const tiles: HeroTile[] = []
  for (let i = 1; i <= HERO_TILES_MAX; i++) {
    const url = str(form, `hero_tile_${i}_image`, 600)
    const video = str(form, `hero_tile_${i}_video`, 600)
    if (!url && !video) continue
    tiles.push({
      url,
      video: video || null,
      label: str(form, `hero_tile_${i}_label`, 80) || null,
      href: str(form, `hero_tile_${i}_href`, 300) || null,
    })
  }
  return tiles
}

/** Fond de la bannière : seule une valeur connue est enregistrée (contrainte CHECK). */
function heroBackground(form: FormData): HeroBackground {
  const value = str(form, 'home_hero_bg', 20)
  return HERO_BACKGROUND_VALUES.includes(value as HeroBackground)
    ? (value as HeroBackground)
    : 'brand'
}

function refreshPublic(paths: string[]) {
  for (const path of paths) revalidatePath(path)
}

// =====================================================================
// Produits
// =====================================================================
export async function saveProduct(form: FormData): Promise<AdminResult<{ id: string }>> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const name = str(form, 'name', 200)
  if (!name) return { ok: false, error: 'Le nom du produit est obligatoire.' }

  const slug = slugify(str(form, 'slug', 200) || name)
  const price = num(form, 'price') ?? 0
  if (price < 0) return { ok: false, error: 'Le prix doit être positif.' }

  const payload = {
    name,
    slug,
    reference: str(form, 'reference', 80) || null,
    category_id: str(form, 'category_id', 40) || null,
    subcategory_id: str(form, 'subcategory_id', 40) || null,
    brand: str(form, 'brand', 80) || null,
    price,
    old_price: num(form, 'old_price'),
    short_description: str(form, 'short_description', 400) || null,
    description: str(form, 'description', 8000) || null,
    specifications: specs(form),
    compatibility: list(form, 'compatibility'),
    keywords: list(form, 'keywords'),
    stock: Math.max(0, Math.floor(num(form, 'stock') ?? 0)),
    is_active: bool(form, 'is_active'),
    is_featured: bool(form, 'is_featured'),
    is_new: bool(form, 'is_new'),
    is_promo: bool(form, 'is_promo'),
    seo_title: str(form, 'seo_title', 200) || null,
    seo_description: str(form, 'seo_description', 400) || null,
  }

  const query = id
    ? supabase.from('products').update(payload).eq('id', id).select('id').single()
    : supabase.from('products').insert(payload).select('id').single()

  const { data, error } = await query
  if (error) {
    return {
      ok: false,
      error: error.code === '23505' ? 'Ce slug est déjà utilisé.' : error.message,
    }
  }

  // La photo envoyée au panneau IA est rattachée au produit, à la création
  // comme à la modification (sinon elle resterait dans le stockage sans
  // jamais s'afficher sur le site).
  const initialImage = str(form, 'initial_image_url', 600)
  if (initialImage) {
    const { data: existing } = await supabase
      .from('product_images')
      .select('id,url')
      .eq('product_id', data.id)

    const already = (existing ?? []).some((img) => img.url === initialImage)
    if (!already) {
      const count = existing?.length ?? 0
      await supabase.from('product_images').insert({
        product_id: data.id,
        url: initialImage,
        alt: name,
        position: count,
        is_primary: count === 0,
      })
    }
  }

  refreshPublic(['/', '/produits', `/produits/${slug}`, '/categories'])
  revalidatePath('/admin/produits')
  return { ok: true, data: { id: data.id } }
}

export async function deleteProduct(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/produits'])
  revalidatePath('/admin/produits')
  return { ok: true }
}

export async function toggleProductActive(id: string, active: boolean): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('products').update({ is_active: active }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/produits'])
  revalidatePath('/admin/produits')
  return { ok: true }
}

export async function duplicateProduct(id: string): Promise<AdminResult<{ id: string }>> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { data: source, error } = await supabase
    .from('products')
    .select('*, product_images(url,alt,position,is_primary)')
    .eq('id', id)
    .single()
  if (error || !source) return { ok: false, error: 'Produit introuvable.' }

  // Champs volontairement écartés de la copie.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    id: _id,
    created_at: _c,
    updated_at: _u,
    search_text: _s,
    product_images: images,
    views: _v,
    sales_count: _sc,
    ...rest
  } = source as Record<string, unknown> & {
    product_images: { url: string; alt: string | null; position: number; is_primary: boolean }[]
  }

  const suffix = Date.now().toString(36).slice(-4)
  const { data: copy, error: copyError } = await supabase
    .from('products')
    .insert({
      ...rest,
      name: `${rest.name as string} (copie)`,
      slug: `${rest.slug as string}-copie-${suffix}`,
      is_active: false,
    })
    .select('id')
    .single()

  if (copyError || !copy) return { ok: false, error: copyError?.message ?? 'Duplication impossible.' }

  if (images?.length) {
    await supabase
      .from('product_images')
      .insert(images.map((img) => ({ ...img, product_id: copy.id })))
  }

  revalidatePath('/admin/produits')
  return { ok: true, data: { id: copy.id } }
}

// =====================================================================
// Images produit
// =====================================================================
export async function addProductImage(
  productId: string,
  url: string,
  alt: string
): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { count } = await supabase
    .from('product_images')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', productId)

  const { error } = await supabase.from('product_images').insert({
    product_id: productId,
    url,
    alt: alt || null,
    position: count ?? 0,
    is_primary: (count ?? 0) === 0,
  })
  if (error) return { ok: false, error: error.message }

  revalidatePath(`/admin/produits/${productId}`)
  refreshPublic(['/', '/produits'])
  return { ok: true }
}

export async function deleteProductImage(imageId: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { data: image } = await supabase
    .from('product_images')
    .select('product_id,url,is_primary')
    .eq('id', imageId)
    .maybeSingle()

  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) return { ok: false, error: error.message }

  if (image?.is_primary) {
    const { data: next } = await supabase
      .from('product_images')
      .select('id')
      .eq('product_id', image.product_id)
      .order('position')
      .limit(1)
      .maybeSingle()
    if (next) await supabase.from('product_images').update({ is_primary: true }).eq('id', next.id)
  }

  // Suppression du fichier dans le bucket si l'URL en provient.
  if (image?.url) {
    const marker = '/storage/v1/object/public/media/'
    const index = image.url.indexOf(marker)
    if (index !== -1) {
      const path = decodeURIComponent(image.url.slice(index + marker.length))
      await createSupabaseAdminClient().storage.from('media').remove([path])
    }
  }

  if (image?.product_id) revalidatePath(`/admin/produits/${image.product_id}`)
  refreshPublic(['/', '/produits'])
  return { ok: true }
}

export async function setPrimaryImage(imageId: string, productId: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId)
  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/produits/${productId}`)
  refreshPublic(['/', '/produits'])
  return { ok: true }
}

export async function moveProductImage(
  imageId: string,
  productId: string,
  direction: -1 | 1
): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { data: images } = await supabase
    .from('product_images')
    .select('id,position')
    .eq('product_id', productId)
    .order('position')

  const rows = images ?? []
  const index = rows.findIndex((r) => r.id === imageId)
  const target = index + direction
  if (index === -1 || target < 0 || target >= rows.length) return { ok: true }

  await Promise.all([
    supabase.from('product_images').update({ position: target }).eq('id', rows[index].id),
    supabase.from('product_images').update({ position: index }).eq('id', rows[target].id),
  ])

  revalidatePath(`/admin/produits/${productId}`)
  return { ok: true }
}

// =====================================================================
// Catégories
// =====================================================================
export async function saveCategory(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const name = str(form, 'name', 120)
  if (!name) return { ok: false, error: 'Le nom de la catégorie est obligatoire.' }

  const payload = {
    name,
    slug: slugify(str(form, 'slug', 120) || name),
    parent_id: str(form, 'parent_id', 40) || null,
    description: str(form, 'description', 1000) || null,
    image_url: str(form, 'image_url', 600) || null,
    image_alt: str(form, 'image_alt', 200) || null,
    icon: str(form, 'icon', 60) || null,
    position: Math.floor(num(form, 'position') ?? 0),
    is_active: bool(form, 'is_active'),
    seo_title: str(form, 'seo_title', 200) || null,
    seo_description: str(form, 'seo_description', 400) || null,
  }

  const { error } = id
    ? await supabase.from('categories').update(payload).eq('id', id)
    : await supabase.from('categories').insert(payload)

  if (error) {
    return { ok: false, error: error.code === '23505' ? 'Ce slug existe déjà.' : error.message }
  }

  refreshPublic(['/', '/categories', `/categories/${payload.slug}`, '/produits'])
  revalidatePath('/admin/categories')
  return { ok: true }
}

export async function deleteCategory(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/categories'])
  revalidatePath('/admin/categories')
  return { ok: true }
}

// =====================================================================
// Boutiques
// =====================================================================
export async function saveShop(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const name = str(form, 'name', 120)
  if (!name) return { ok: false, error: 'Le nom de la boutique est obligatoire.' }

  const payload = {
    name,
    slug: slugify(str(form, 'slug', 120) || name),
    description: str(form, 'description', 1000) || null,
    address: str(form, 'address', 300) || null,
    city: str(form, 'city', 80) || null,
    district: str(form, 'district', 120) || null,
    phone: str(form, 'phone', 40) || null,
    whatsapp: str(form, 'whatsapp', 40) || null,
    hours: str(form, 'hours', 200) || null,
    latitude: num(form, 'latitude'),
    longitude: num(form, 'longitude'),
    image_url: str(form, 'image_url', 600) || null,
    video_url: str(form, 'video_url', 600) || null,
    map_url: str(form, 'map_url', 600) || null,
    position: Math.floor(num(form, 'position') ?? 0),
    is_active: bool(form, 'is_active'),
  }

  const { error } = id
    ? await supabase.from('shops').update(payload).eq('id', id)
    : await supabase.from('shops').insert(payload)

  if (error) {
    return { ok: false, error: error.code === '23505' ? 'Ce slug existe déjà.' : error.message }
  }

  refreshPublic(['/', '/boutiques', '/contact'])
  revalidatePath('/admin/boutiques')
  return { ok: true }
}

export async function deleteShop(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('shops').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/boutiques'])
  revalidatePath('/admin/boutiques')
  return { ok: true }
}

// =====================================================================
// Services (mécanique)
// =====================================================================
export async function saveService(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const title = str(form, 'title', 120)
  if (!title) return { ok: false, error: 'Le titre du service est obligatoire.' }

  const payload = {
    title,
    slug: slugify(str(form, 'slug', 120) || title),
    description: str(form, 'description', 400) || null,
    details: str(form, 'details', 4000) || null,
    price_label: str(form, 'price_label', 120) || null,
    image_url: str(form, 'image_url', 600) || null,
    icon: str(form, 'icon', 60) || null,
    position: Math.floor(num(form, 'position') ?? 0),
    is_active: bool(form, 'is_active'),
  }

  const { error } = id
    ? await supabase.from('services').update(payload).eq('id', id)
    : await supabase.from('services').insert(payload)

  if (error) {
    return { ok: false, error: error.code === '23505' ? 'Ce slug existe déjà.' : error.message }
  }

  refreshPublic(['/', '/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

export async function deleteService(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

// =====================================================================
// Galerie de l'atelier (page /mecanique)
// =====================================================================
/** Ajout groupé après téléversement : une ligne par photo, en fin de galerie. */
export async function addWorkshopPhotos(urls: string[]): Promise<AdminResult> {
  await guard()
  if (urls.length === 0) return { ok: true }
  const supabase = await createSupabaseServerClient()

  const { data: last } = await supabase
    .from('workshop_gallery')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle()

  const start = (last?.position ?? -10) + 10
  const rows = urls.slice(0, 20).map((url, i) => ({
    image_url: url.slice(0, 600),
    position: start + i * 10,
    is_active: true,
  }))

  const { error } = await supabase.from('workshop_gallery').insert(rows)
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

export async function saveWorkshopPhoto(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const imageUrl = str(form, 'image_url', 600)
  if (!imageUrl) return { ok: false, error: 'La photo est obligatoire.' }

  const payload = {
    title: str(form, 'title', 120) || null,
    caption: str(form, 'caption', 400) || null,
    image_url: imageUrl,
    before_url: str(form, 'before_url', 600) || null,
    service_id: str(form, 'service_id', 40) || null,
    position: Math.floor(num(form, 'position') ?? 0),
    is_active: bool(form, 'is_active'),
  }

  const { error } = id
    ? await supabase.from('workshop_gallery').update(payload).eq('id', id)
    : await supabase.from('workshop_gallery').insert(payload)
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

export async function deleteWorkshopPhoto(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('workshop_gallery').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

/** Déplacement d'une photo d'un cran : les positions des deux voisines sont échangées. */
export async function moveWorkshopPhoto(id: string, direction: -1 | 1): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { data: photos } = await supabase
    .from('workshop_gallery')
    .select('id,position')
    .order('position')
    .order('created_at')

  const list = photos ?? []
  const index = list.findIndex((p) => p.id === id)
  const target = index + direction
  if (index === -1 || target < 0 || target >= list.length) return { ok: true }

  const a = list[index]
  const b = list[target]
  await supabase.from('workshop_gallery').update({ position: b.position }).eq('id', a.id)
  await supabase.from('workshop_gallery').update({ position: a.position }).eq('id', b.id)

  refreshPublic(['/mecanique'])
  revalidatePath('/admin/mecanique')
  return { ok: true }
}

// =====================================================================
// Marques partenaires
// =====================================================================
export async function savePartnerBrand(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const id = str(form, 'id', 40)
  const name = str(form, 'name', 120)
  if (!name) return { ok: false, error: 'Le nom de la marque est obligatoire.' }

  const payload = {
    name,
    slug: slugify(str(form, 'slug', 120) || name),
    logo_url: str(form, 'logo_url', 600) || null,
    website_url: str(form, 'website_url', 400) || null,
    is_primary: bool(form, 'is_primary'),
    position: Math.floor(num(form, 'position') ?? 0),
    is_active: bool(form, 'is_active'),
  }

  const { error } = id
    ? await supabase.from('partner_brands').update(payload).eq('id', id)
    : await supabase.from('partner_brands').insert(payload)

  if (error) {
    return { ok: false, error: error.code === '23505' ? 'Ce slug existe déjà.' : error.message }
  }

  refreshPublic(['/'])
  revalidatePath('/admin/marques')
  return { ok: true }
}

export async function deletePartnerBrand(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('partner_brands').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/'])
  revalidatePath('/admin/marques')
  return { ok: true }
}

/** Titre et texte d'introduction de la section « Nos marques partenaires ». */
export async function saveBrandsSection(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from('site_settings').upsert({
    id: 1,
    home_brands_title: str(form, 'home_brands_title', 200) || null,
    home_brands_intro: str(form, 'home_brands_intro', 2000) || null,
  })
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/'])
  revalidatePath('/admin/marques')
  return { ok: true }
}

// =====================================================================
// Commandes & messages
// =====================================================================
/**
 * Rend au stock les articles d'une commande, une seule fois : `stock_applied`
 * empêche une double remise (annulation puis suppression, par exemple).
 */
async function restockOrder(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  id: string
): Promise<void> {
  const { data: order } = await supabase
    .from('orders')
    .select('stock_applied, items:order_items(product_id,quantity)')
    .eq('id', id)
    .maybeSingle()

  const row = order as {
    stock_applied: boolean | null
    items: { product_id: string | null; quantity: number }[] | null
  } | null
  if (!row?.stock_applied) return

  const items = (row.items ?? []).filter((i) => i.product_id)
  if (items.length > 0) {
    await supabase.rpc('increment_stock', {
      p_items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
    })
  }
  await supabase.from('orders').update({ stock_applied: false }).eq('id', id)
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  adminNote?: string
): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase
    .from('orders')
    .update({ status, ...(adminNote !== undefined ? { admin_note: adminNote || null } : {}) })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }

  // Une commande annulée rend ses articles au stock.
  if (status === 'annulee') await restockOrder(supabase, id)

  refreshPublic(['/', '/produits'])
  revalidatePath('/admin/commandes')
  revalidatePath(`/admin/commandes/${id}`)
  return { ok: true }
}

export async function updateOrderDelivery(id: string, fee: number): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { data: order } = await supabase.from('orders').select('subtotal').eq('id', id).single()
  if (!order) return { ok: false, error: 'Commande introuvable.' }

  const { error } = await supabase
    .from('orders')
    .update({ delivery_fee: fee, total: Number(order.subtotal) + fee })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath(`/admin/commandes/${id}`)
  return { ok: true }
}

export async function deleteOrder(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  // Avant l'effacement : les lignes disparaissent en cascade.
  await restockOrder(supabase, id)

  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  refreshPublic(['/', '/produits'])
  revalidatePath('/admin/commandes')
  return { ok: true }
}

export async function updateMessageStatus(
  id: string,
  status: MessageStatus
): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/messages')
  return { ok: true }
}

export async function deleteMessage(id: string): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('contact_messages').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/messages')
  return { ok: true }
}

// =====================================================================
// Contenus & paramètres
// =====================================================================
export async function saveDeliveryContent(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from('delivery_content').upsert({
    id: 1,
    delivery_title: str(form, 'delivery_title', 200) || null,
    delivery_body: str(form, 'delivery_body', 20000) || null,
    return_title: str(form, 'return_title', 200) || null,
    return_body: str(form, 'return_body', 20000) || null,
    seo_title: str(form, 'seo_title', 200) || null,
    seo_description: str(form, 'seo_description', 400) || null,
  })
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/livraison-retour'])
  revalidatePath('/admin/livraison')
  return { ok: true }
}

export async function saveHomePromo(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  // Liste d'identifiants produits, séparés par des virgules, ordre conservé.
  const productIds = [
    ...new Set(
      str(form, 'product_ids', 2000)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    ),
  ].slice(0, HOME_PROMO_PRODUCTS_MAX)

  const rawEnd = str(form, 'ends_at', 40)
  const endsAt = rawEnd ? new Date(rawEnd) : null
  if (endsAt && Number.isNaN(endsAt.getTime())) {
    return { ok: false, error: 'La date de fin n’est pas valide.' }
  }

  const { error } = await supabase.from('home_promo').upsert({
    id: 1,
    is_active: bool(form, 'is_active'),
    eyebrow: str(form, 'eyebrow', 80) || null,
    title: str(form, 'title', 200) || null,
    description: str(form, 'description', 800) || null,
    image_url: str(form, 'image_url', 600) || null,
    cta_label: str(form, 'cta_label', 60) || null,
    cta_href: str(form, 'cta_href', 300) || null,
    ends_at: endsAt ? endsAt.toISOString() : null,
    product_ids: productIds,
  })
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/'])
  revalidatePath('/admin/promotion')
  return { ok: true }
}

export async function saveSettings(form: FormData): Promise<AdminResult> {
  await guard()
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from('site_settings').upsert({
    id: 1,
    company_name: str(form, 'company_name', 120) || 'SUPER & RESISTANT',
    tagline: str(form, 'tagline', 300) || null,
    logo_url: str(form, 'logo_url', 600) || null,
    favicon_url: str(form, 'favicon_url', 600) || null,
    phone_primary: str(form, 'phone_primary', 40) || null,
    phone_secondary: str(form, 'phone_secondary', 40) || null,
    whatsapp: str(form, 'whatsapp', 40) || null,
    whatsapp_message: str(form, 'whatsapp_message', 400) || null,
    email: str(form, 'email', 160) || null,
    address: str(form, 'address', 300) || null,
    hours: str(form, 'hours', 200) || null,
    delivery_title: str(form, 'delivery_title', 80) || null,
    delivery_text: str(form, 'delivery_text', 160) || null,
    facebook_url: str(form, 'facebook_url', 400) || null,
    tiktok_url: str(form, 'tiktok_url', 400) || null,
    instagram_url: str(form, 'instagram_url', 400) || null,
    youtube_url: str(form, 'youtube_url', 400) || null,
    seo_title: str(form, 'seo_title', 200) || null,
    seo_description: str(form, 'seo_description', 400) || null,
    seo_keywords: str(form, 'seo_keywords', 600) || null,
    og_image_url: str(form, 'og_image_url', 600) || null,
    home_hero_title: str(form, 'home_hero_title', 200) || null,
    home_hero_subtitle: str(form, 'home_hero_subtitle', 500) || null,
    home_hero_image: str(form, 'home_hero_image', 600) || null,
    home_hero_video: str(form, 'home_hero_video', 600) || null,
    home_hero_bg: heroBackground(form),
    home_hero_bg_image: str(form, 'home_hero_bg_image', 600) || null,
    home_hero_tiles: heroTiles(form),
    home_seo_content: str(form, 'home_seo_content', 8000) || null,
  })
  if (error) return { ok: false, error: error.message }

  refreshPublic(['/', '/produits', '/categories', '/boutiques', '/mecanique', '/contact'])
  revalidatePath('/admin/parametres')
  return { ok: true }
}

// =====================================================================
// Utilisateurs du back-office
// =====================================================================
export async function createAdminUser(form: FormData): Promise<AdminResult> {
  await guard()

  const email = str(form, 'email', 160).toLowerCase()
  const password = str(form, 'password', 100)
  const fullName = str(form, 'full_name', 120)

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'Adresse e-mail invalide.' }
  }
  if (password.length < 8) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' }
  }

  const admin = createSupabaseAdminClient()
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email, backoffice: 'true', role: 'admin' },
  })
  if (error) return { ok: false, error: error.message }

  await admin.from('profiles').upsert(
    {
      id: data.user.id,
      email,
      full_name: fullName || email,
      role: 'admin',
      is_active: true,
    },
    { onConflict: 'id' }
  )

  revalidatePath('/admin/utilisateurs')
  return { ok: true }
}

export async function setAdminUserActive(id: string, active: boolean): Promise<AdminResult> {
  const profile = await guard()
  if (profile.id === id) {
    return { ok: false, error: 'Vous ne pouvez pas désactiver votre propre compte.' }
  }
  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/utilisateurs')
  return { ok: true }
}

export async function deleteAdminUser(id: string): Promise<AdminResult> {
  const profile = await guard()
  if (profile.id === id) {
    return { ok: false, error: 'Vous ne pouvez pas supprimer votre propre compte.' }
  }
  const admin = createSupabaseAdminClient()
  const { error } = await admin.auth.admin.deleteUser(id)
  if (error) return { ok: false, error: error.message }
  await admin.from('profiles').delete().eq('id', id)
  revalidatePath('/admin/utilisateurs')
  return { ok: true }
}
