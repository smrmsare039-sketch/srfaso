import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check, Package, Truck, X } from 'lucide-react'
import { SITE_URL } from '@/app/layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { ProductGallery } from '@/components/product-gallery'
import { ProductPurchase } from '@/components/product-purchase'
import { SectionHeading } from '@/components/section-heading'
import { getProductBySlug, getRelatedProducts, getSettings } from '@/lib/data'
import { discountPercent, formatPrice, truncate } from '@/lib/utils'

export const revalidate = 300

export async function generateMetadata(
  props: PageProps<'/produits/[slug]'>
): Promise<Metadata> {
  const { slug } = await props.params
  const product = await getProductBySlug(slug)
  if (!product) return { title: 'Produit introuvable' }

  const title =
    product.seo_title ?? `${product.name} | Pièces Moto Burkina Faso | SR Faso`
  const description =
    product.seo_description ??
    truncate(
      product.short_description ??
        product.description ??
        `${product.name} disponible chez SUPER & RESISTANT à Ouagadougou. Livraison partout au Burkina Faso.`,
      160
    )
  const image = product.images?.[0]?.url

  return {
    title,
    description,
    alternates: { canonical: `/produits/${product.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/produits/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  }
}

export default async function ProductPage(props: PageProps<'/produits/[slug]'>) {
  const { slug } = await props.params
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()])
  if (!product) notFound()

  const related = await getRelatedProducts(product, 5)
  const discount = discountPercent(Number(product.price), Number(product.old_price))
  const inStock = product.stock > 0
  const productUrl = `${SITE_URL}/produits/${product.slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.short_description ?? product.description ?? undefined,
    sku: product.reference ?? product.slug,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    image: product.images?.map((i) => i.url),
    category: product.category?.name,
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'XOF',
      price: Number(product.price),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: settings.company_name },
    },
  }

  return (
    <div className="container-page pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs
        items={[
          { label: 'Produits', href: '/produits' },
          ...(product.category
            ? [{ label: product.category.name, href: `/categories/${product.category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2">
        <ProductGallery images={product.images ?? []} productName={product.name} />

        <div>
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-xs font-bold tracking-[0.14em] text-brand-600 uppercase"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-2 text-3xl leading-tight font-extrabold text-ink-900 sm:text-[38px]">
            {product.name}
          </h1>

          <dl className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-ink-500">
            {product.reference && (
              <div className="flex gap-1.5">
                <dt>Référence :</dt>
                <dd className="font-semibold text-ink-800">{product.reference}</dd>
              </div>
            )}
            {product.brand && (
              <div className="flex gap-1.5">
                <dt>Marque :</dt>
                <dd className="font-semibold text-ink-800">{product.brand}</dd>
              </div>
            )}
          </dl>

          <div className="mt-6 flex flex-wrap items-baseline gap-3">
            <span className="font-display text-4xl font-extrabold text-brand-600">
              {formatPrice(product.price)}
            </span>
            {product.old_price && Number(product.old_price) > Number(product.price) && (
              <>
                <span className="text-xl text-ink-400 line-through">
                  {formatPrice(product.old_price)}
                </span>
                {discount !== null && (
                  <span className="rounded-full bg-brand-600 px-2.5 py-1 text-xs font-bold text-white">
                    -{discount}%
                  </span>
                )}
              </>
            )}
          </div>

          <p
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ${
              inStock ? 'bg-green-50 text-green-700' : 'bg-ink-100 text-ink-500'
            }`}
          >
            {inStock ? <Check className="size-4" /> : <X className="size-4" />}
            {inStock ? 'En stock' : 'Rupture de stock'}
          </p>

          {product.short_description && (
            <p className="mt-5 text-[15px] leading-relaxed text-ink-600">
              {product.short_description}
            </p>
          )}

          <ProductPurchase
            product={product}
            whatsapp={settings.whatsapp}
            productUrl={productUrl}
          />

          <ul className="mt-7 grid gap-2.5 border-t border-ink-100 pt-6 sm:grid-cols-2">
            <li className="flex items-center gap-2.5 text-sm text-ink-600">
              <Truck className="size-4 shrink-0 text-brand-600" aria-hidden />
              {settings.delivery_text ?? 'Livraison partout au Burkina Faso'}
            </li>
            <li className="flex items-center gap-2.5 text-sm text-ink-600">
              <Package className="size-4 shrink-0 text-brand-600" aria-hidden />
              Retrait gratuit en boutique à Ouagadougou
            </li>
          </ul>
        </div>
      </div>

      {/* Détails */}
      <div className="mt-14 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {product.description && (
            <section>
              <h2 className="text-xl font-extrabold text-ink-900">Description</h2>
              <div className="prose-sr mt-3">
                {product.description.split('\n').filter(Boolean).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          )}

          {product.compatibility?.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-extrabold text-ink-900">Compatibilité</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.compatibility.map((model) => (
                  <li
                    key={model}
                    className="rounded-full border border-ink-200 px-3.5 py-1.5 text-sm font-medium text-ink-700"
                  >
                    {model}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {product.specifications?.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-ink-900">Caractéristiques</h2>
            <dl className="mt-3 overflow-hidden rounded-2xl border border-ink-100">
              {product.specifications.map((spec, i) => (
                <div
                  key={`${spec.label}-${i}`}
                  className="flex justify-between gap-4 border-b border-ink-100 px-4 py-3 text-sm last:border-0 odd:bg-ink-50/60"
                >
                  <dt className="text-ink-500">{spec.label}</dt>
                  <dd className="text-right font-semibold text-ink-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading title="Produits similaires" href="/produits" />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
