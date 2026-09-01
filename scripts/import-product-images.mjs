// Récupère les photos des produits depuis la boutique WooCommerce
// (fasocademy.com, API publique du Store) et les rattache aux produits du site.
//
// Usage : node scripts/import-product-images.mjs            (aperçu)
//         node scripts/import-product-images.mjs --apply    (téléverse + enregistre)
//         --force   remplace les images des produits qui en ont déjà
//         --max=4   nombre maximum d'images par produit (défaut : 4)
import { createClient } from '@supabase/supabase-js'
import './env.mjs'

const SOURCE = 'https://fasocademy.com/wp-json/wc/store/v1/products'
const apply = process.argv.includes('--apply')
const force = process.argv.includes('--force')
const maxImages = Number(process.argv.find((a) => a.startsWith('--max='))?.split('=')[1] ?? 4)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('\nNEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant.\n')
  process.exit(1)
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------
// Normalisation utilisée pour le rapprochement des fiches
// ---------------------------------------------------------------------
const normalize = (value) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const STOP = new Set(['de', 'la', 'le', 'du', 'des', 'pour', 'et', 'sr', 'motorcycle', 'moto'])
const tokens = (value) => normalize(value).split(' ').filter((t) => t && !STOP.has(t))

/** Similarité de Jaccard entre deux listes de mots. */
function similarity(a, b) {
  const setA = new Set(a)
  const setB = new Set(b)
  let shared = 0
  for (const t of setA) if (setB.has(t)) shared++
  return shared / (setA.size + setB.size - shared)
}

// ---------------------------------------------------------------------
// Source WooCommerce
// ---------------------------------------------------------------------
async function fetchWooProducts() {
  const all = []
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${SOURCE}?per_page=100&page=${page}`)
    if (!res.ok) throw new Error(`WooCommerce ${res.status}`)
    const batch = await res.json()
    all.push(...batch)
    const totalPages = Number(res.headers.get('x-wp-totalpages') ?? 1)
    if (page >= totalPages || batch.length === 0) break
  }
  return all
}

const woo = await fetchWooProducts()
console.log(`Fiches WooCommerce : ${woo.length}`)

const { data: products, error } = await supabase
  .from('products')
  .select('id,name,slug,product_images(id)')
  .order('name')
if (error) throw error
console.log(`Produits du site : ${products.length}`)

// ---------------------------------------------------------------------
// Rapprochement
// ---------------------------------------------------------------------
/** Fiches dont le nom WooCommerce est trop abîmé pour un rapprochement automatique. */
const ALIASES = { 'courroie-galets-soul-gt-mio-125': 11522 }

const wooById = new Map(woo.map((w) => [w.id, w]))
const wooBySlug = new Map(woo.map((w) => [w.slug, w]))
const wooByName = new Map(woo.map((w) => [normalize(w.name), w]))
const used = new Set()

const plan = []
const unmatched = []
const fuzzy = []

for (const product of products) {
  let match =
    wooById.get(ALIASES[product.slug]) ??
    wooBySlug.get(product.slug) ??
    wooByName.get(normalize(product.name))

  if (!match) {
    // Rapprochement approximatif sur les mots du nom.
    const wanted = tokens(product.name)
    let best = null
    let bestScore = 0
    for (const candidate of woo) {
      const score = similarity(wanted, tokens(candidate.name))
      if (score > bestScore) {
        bestScore = score
        best = candidate
      }
    }
    if (bestScore >= 0.6) {
      match = best
      fuzzy.push(`${product.name}  →  ${best.name} (${bestScore.toFixed(2)})`)
    }
    else {
      unmatched.push(`${product.name}  →  meilleur candidat : ${best?.name ?? '—'} (${bestScore.toFixed(2)})`)
      continue
    }
  }

  const images = (match.images ?? [])
    .map((img) => ({ src: img.src, alt: img.alt || product.name }))
    .filter((img) => img.src && !/woocommerce-placeholder/i.test(img.src))
    .slice(0, maxImages)

  if (images.length === 0) {
    unmatched.push(`${product.name}  →  aucune photo sur la fiche WooCommerce`)
    continue
  }

  const hasImages = (product.product_images ?? []).length > 0
  if (hasImages && !force) continue

  used.add(match.id)
  plan.push({ product, images, hasImages })
}

console.log(`\nProduits à illustrer : ${plan.length}`)
console.log(`Images à importer : ${plan.reduce((n, p) => n + p.images.length, 0)}`)
if (fuzzy.length) {
  console.log(`
Rapprochements approximatifs (${fuzzy.length}) — à vérifier :`)
  for (const line of fuzzy) console.log(`  · ${line}`)
}
if (unmatched.length) {
  console.log(`\nSans correspondance (${unmatched.length}) :`)
  for (const line of unmatched) console.log(`  · ${line}`)
}

if (!apply) {
  console.log('\nAperçu de 5 rapprochements :')
  for (const item of plan.slice(0, 5)) {
    console.log(`  ${item.product.name}\n    ${item.images.map((i) => i.src).join('\n    ')}`)
  }
  console.log('\nAperçu uniquement. Relancer avec --apply pour téléverser.\n')
  process.exit(0)
}

// ---------------------------------------------------------------------
// Téléchargement + envoi dans le stockage Supabase
// ---------------------------------------------------------------------
let uploaded = 0
let failed = 0

for (const [index, item] of plan.entries()) {
  const { product, images, hasImages } = item

  if (hasImages && force) {
    await supabase.from('product_images').delete().eq('product_id', product.id)
  }

  const rows = []
  for (const [i, image] of images.entries()) {
    try {
      const res = await fetch(image.src)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const type = res.headers.get('content-type') ?? 'image/jpeg'
      const buffer = Buffer.from(await res.arrayBuffer())
      const extension = (image.src.split('.').pop() ?? 'jpg').split('?')[0].toLowerCase()
      const path = `produits/${product.id}/${product.slug.slice(0, 60)}-${i + 1}.${extension}`

      const { error: upErr } = await supabase.storage
        .from('media')
        .upload(path, buffer, { contentType: type, cacheControl: '31536000', upsert: true })
      if (upErr) throw upErr

      const { data } = supabase.storage.from('media').getPublicUrl(path)
      rows.push({
        product_id: product.id,
        url: data.publicUrl,
        alt: image.alt,
        position: i,
        is_primary: i === 0,
      })
      uploaded++
    } catch (err) {
      failed++
      console.warn(`  ⚠ ${product.name} — image ${i + 1} : ${err.message}`)
    }
  }

  if (rows.length) {
    const { error: insertError } = await supabase.from('product_images').insert(rows)
    if (insertError) console.warn(`  ⚠ ${product.name} : ${insertError.message}`)
  }

  if ((index + 1) % 10 === 0 || index === plan.length - 1) {
    console.log(`  ${index + 1}/${plan.length} produits traités (${uploaded} images)`)
  }
}

const { count } = await supabase
  .from('product_images')
  .select('id', { count: 'exact', head: true })
console.log(`\nImages en base : ${count} (${uploaded} envoyées, ${failed} en échec).\n`)
