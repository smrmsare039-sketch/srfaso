// Aligne les prix des produits sur la boutique WooCommerce (fasocademy.com) :
// prix courant, ancien prix barré (prix normal quand une promotion est active)
// et indicateur « promo ».
//
// Usage : node scripts/sync-prices.mjs           (aperçu)
//         node scripts/sync-prices.mjs --apply   (écrit en base)
//         --prix  aligne aussi le prix courant sur WooCommerce
import { createClient } from '@supabase/supabase-js'
import './env.mjs'

const SOURCE = 'https://fasocademy.com/wp-json/wc/store/v1/products'
const apply = process.argv.includes('--apply')
const syncPrice = process.argv.includes('--prix')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('\nNEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.\n')
  process.exit(1)
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

/** Fiches dont le nom WooCommerce est trop abîmé pour un rapprochement automatique. */
const ALIASES = { 'courroie-galets-soul-gt-mio-125': 11522 }

async function fetchWooProducts() {
  const all = []
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${SOURCE}?per_page=100&page=${page}`)
    if (!res.ok) throw new Error(`WooCommerce ${res.status}`)
    const batch = await res.json()
    all.push(...batch)
    if (page >= Number(res.headers.get('x-wp-totalpages') ?? 1) || batch.length === 0) break
  }
  return all
}

/** Les montants du Store API sont en unités mineures (0 décimale pour le FCFA). */
const toAmount = (value, minorUnit) => Number(value) / 10 ** minorUnit

const woo = await fetchWooProducts()
const wooById = new Map(woo.map((w) => [w.id, w]))
const wooBySlug = new Map(woo.map((w) => [w.slug, w]))
const wooByName = new Map(woo.map((w) => [normalize(w.name), w]))

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,slug,price,old_price,is_promo')
  .order('name')
if (error) throw error

const updates = []
const priceGaps = []
const unmatched = []

for (const product of products) {
  const match =
    wooById.get(ALIASES[product.slug]) ??
    wooBySlug.get(product.slug) ??
    wooByName.get(normalize(product.name))

  if (!match) {
    unmatched.push(product.name)
    continue
  }

  const minor = match.prices.currency_minor_unit ?? 0
  const price = toAmount(match.prices.price, minor)
  const regular = toAmount(match.prices.regular_price, minor)

  const oldPrice = regular > price ? regular : null
  const isPromo = oldPrice !== null

  if (Number(product.price) !== price) {
    priceGaps.push(`${product.name} : site ${product.price} ≠ WooCommerce ${price}`)
  }

  const changed =
    Number(product.old_price ?? 0) !== Number(oldPrice ?? 0) ||
    product.is_promo !== isPromo ||
    (syncPrice && Number(product.price) !== price)

  if (!changed) continue

  updates.push({
    id: product.id,
    name: product.name,
    patch: {
      old_price: oldPrice,
      is_promo: isPromo,
      ...(syncPrice ? { price } : {}),
    },
  })
}

console.log(`Produits : ${products.length} — à mettre à jour : ${updates.length}`)
if (unmatched.length) console.log(`Sans correspondance (${unmatched.length}) : ${unmatched.join(', ')}`)
if (priceGaps.length) {
  console.log(`\nÉcarts de prix courant (${priceGaps.length})${syncPrice ? ' — alignés' : ' — conservés tels quels'} :`)
  for (const line of priceGaps.slice(0, 20)) console.log(`  · ${line}`)
}

console.log('\nExemples :')
for (const u of updates.slice(0, 8)) {
  console.log(`  ${u.name} → ancien prix ${u.patch.old_price ?? '—'} / promo ${u.patch.is_promo}`)
}

if (!apply) {
  console.log('\nAperçu uniquement. Relancer avec --apply pour écrire.\n')
  process.exit(0)
}

let done = 0
for (const u of updates) {
  const { error: updateError } = await supabase.from('products').update(u.patch).eq('id', u.id)
  if (updateError) console.warn(`  ⚠ ${u.name} : ${updateError.message}`)
  else done++
}

const { count } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
  .eq('is_promo', true)
console.log(`\n${done} produit(s) mis à jour — ${count} en promotion.\n`)
