// Remplace tout le catalogue par le contenu de scripts/data/produits-import.csv.
// Usage : node scripts/import-products.mjs           (aperçu, aucune écriture)
//         node scripts/import-products.mjs --apply   (supprime puis réimporte)
//
// Le CSV exporté depuis WooCommerce est en UTF-8 relu en Windows-1252
// (« Ã© » pour « é ») : il est réparé ici avant import.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { root } from './env.mjs'

const apply = process.argv.includes('--apply')
const csvPath = path.join(root, 'scripts', 'data', 'produits-import.csv')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error('\nNEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env.local.\n')
  process.exit(1)
}

// ---------------------------------------------------------------------
// Réparation de l'encodage
// ---------------------------------------------------------------------
const MOJIBAKE = [
  [/Ã©/g, 'é'], [/Ã¨/g, 'è'], [/Ãª/g, 'ê'], [/Ã«/g, 'ë'],
  [/Ã /g, 'à'], [/Ã¢/g, 'â'], [/Ã§/g, 'ç'],
  // « à » : l'octet A0 (espace insécable) est parfois normalisé en espace.
  [/Ã(?=[  ])/g, 'à'],
  [/Ã®/g, 'î'], [/Ã¯/g, 'ï'], [/Ã´/g, 'ô'],
  [/Ã¹/g, 'ù'], [/Ã»/g, 'û'],
  [/Ã‰/g, 'É'], [/Ãˆ/g, 'È'], [/Ã€/g, 'À'],
  // Émojis de l'export (✔️, 📦) : leurs octets sont illisibles, on les retire.
  [/â[-￿]*ï¸/g, ''], [/ð[-￿]?/g, ''],
]

function fixEncoding(text) {
  let out = text
  for (const [pattern, replacement] of MOJIBAKE) out = out.replace(pattern, replacement)
  // « â » isolé : apostrophe typographique entre deux lettres, tiret sinon.
  out = out.replace(/(\p{L})â(\p{L})/gu, '$1’$2').replace(/ â /g, ' – ')
  return out.replace(/&amp;/g, '&').replace(/[ ]/g, ' ')
}

// ---------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += c
      continue
    }
    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (c !== '\r') field += c
  }
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  const header = rows.shift().map((h) => h.replace(/^﻿/, '').trim())
  return rows
    .filter((r) => r.some((v) => v.trim()))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

const stripHtml = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    // Coquilles de l'export (première lettre mangée).
    .replace(/^ableau de bord/, 'Tableau de bord')

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

/** Le nom du CSV contient parfois la fiche entière : on garde la première partie. */
function cleanName(raw) {
  // Certaines lignes contiennent la fiche entière dans le nom : on coupe au
  // premier marqueur de description.
  let name = raw.replace(/\s+/g, ' ').trim()
  name = name.split(/\s*(?:Brève description|Description)\s*:/u)[0].trim()
  // Correction des coquilles d'export (première lettre mangée).
  const TYPOS = { 'ourroie + Galets Soul GT Mio 125': 'Courroie + Galets Soul GT Mio 125',
    'mpoule LED phare moto haute performance – SR Motorcycle':
      'Ampoule LED phare moto haute performance – SR Motorcycle' }
  return TYPOS[name] ?? name
}

/** Marques telles qu'affichées sur le site. */
const BRANDS = { SR: 'SUPER & RESISTANT', HONDA: 'Honda', YAMAHA: 'Yamaha', SUZUKI: 'Suzuki' }

/** Catégories du CSV → catégories du site (les noms diffèrent parfois). */
const CATEGORY_ALIASES = {
  accesssoires: 'accessoires',
  electrique: 'electrique',
  eclairage: 'eclairage',
}

const csv = fixEncoding(await readFile(csvPath, 'utf8'))
const rows = parseCsv(csv)

const leftovers = csv.match(/[ÃðâÂ]./g)
if (leftovers) console.warn('⚠ Séquences douteuses restantes :', [...new Set(leftovers)].join(' '))

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: categories, error: catError } = await supabase
  .from('categories')
  .select('id,name,slug,position')
if (catError) throw catError

const bySlug = new Map(categories.map((c) => [c.slug, c]))

// Catégories du CSV absentes du site : créées à la volée.
const wanted = [...new Set(rows.map((r) => r.categorie).filter(Boolean))]
const missing = wanted.filter((name) => {
  const slug = CATEGORY_ALIASES[slugify(name)] ?? slugify(name)
  return !bySlug.has(slug)
})

if (missing.length) {
  console.log('Catégories à créer :', missing.join(', '))
  if (apply) {
    let position = Math.max(0, ...categories.map((c) => c.position)) + 10
    for (const name of missing) {
      const slug = slugify(name)
      const { data, error } = await supabase
        .from('categories')
        .insert({ name, slug, position, is_active: true })
        .select('id,name,slug,position')
        .single()
      if (error) throw error
      bySlug.set(slug, data)
      position += 10
    }
  }
}

// ---------------------------------------------------------------------
// Lignes → produits
// ---------------------------------------------------------------------
const seenSlugs = new Set()
const seenRows = new Set()
const products = []
const skipped = []

for (const row of rows) {
  const name = cleanName(row.nom)
  if (!name) continue

  const description = stripHtml(row.description)
  const price = Number(String(row.prix_vente).replace(',', '.')) || 0
  const fingerprint = `${name}|${price}|${description}`

  if (seenRows.has(fingerprint)) {
    skipped.push(name)
    continue
  }
  seenRows.add(fingerprint)

  let slug = slugify(name)
  let n = 2
  while (seenSlugs.has(slug)) slug = `${slugify(name).slice(0, 86)}-${n++}`
  seenSlugs.add(slug)

  const categorySlug = CATEGORY_ALIASES[slugify(row.categorie)] ?? slugify(row.categorie)
  const category = bySlug.get(categorySlug)
  if (row.categorie && !category && !apply) {
    console.warn(`  (catégorie « ${row.categorie} » à créer pour « ${name} »)`)
  }

  const brand = BRANDS[row.marque.toUpperCase()] ?? (row.marque || null)
  const short = description.length <= 200 ? description : `${description.slice(0, 197).trim()}…`

  products.push({
    name,
    slug,
    reference: row.sku || null,
    category_id: category?.id ?? null,
    brand,
    price,
    short_description: short || null,
    description: description || null,
    specifications: [],
    compatibility: [],
    keywords: [],
    stock: Number(row.stock_entrant) || 0,
    is_active: row.actif === '1',
  })
}

console.log(`\nLignes CSV : ${rows.length}`)
console.log(`Produits à importer : ${products.length}`)
if (skipped.length) console.log(`Doublons exacts ignorés (${skipped.length}) : ${skipped.join(', ')}`)
console.log('\nExemple :', JSON.stringify(products[0], null, 2))

const sansCategorie = products.filter((p) => !p.category_id).map((p) => p.name)
if (sansCategorie.length) console.log(`\nSans catégorie (${sansCategorie.length}) :`, sansCategorie.join(', '))

if (process.argv.includes('--list')) {
  for (const p of products) {
    console.log(`${p.price}	${p.brand ?? '—'}	${p.slug}	${p.name}`)
  }
}

if (!apply) {
  console.log('\nAperçu uniquement. Relancer avec --apply pour remplacer le catalogue.\n')
  process.exit(0)
}

// ---------------------------------------------------------------------
// Remplacement du catalogue
// ---------------------------------------------------------------------
const { count: before } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })

const { error: deleteError } = await supabase
  .from('products')
  .delete()
  .not('id', 'is', null)
if (deleteError) throw deleteError
console.log(`\n${before ?? 0} produit(s) supprimé(s).`)

for (let i = 0; i < products.length; i += 50) {
  const batch = products.slice(i, i + 50)
  const { error } = await supabase.from('products').insert(batch)
  if (error) throw error
  console.log(`  ${Math.min(i + batch.length, products.length)}/${products.length} importés`)
}

const { count: after } = await supabase
  .from('products')
  .select('id', { count: 'exact', head: true })
console.log(`\nCatalogue : ${after} produits.\n`)
