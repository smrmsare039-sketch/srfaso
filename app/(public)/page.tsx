import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Headset,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import { BrandStrip } from '@/components/brand-strip'
import { CategoryIcon } from '@/components/category-icon'
import { HomePromoSection } from '@/components/home-promo'
import { ProductCard } from '@/components/product-card'
import { SectionHeading } from '@/components/section-heading'
import {
  getCategoryCounts,
  getFeaturedProducts,
  getHomePromo,
  getHomePromoProducts,
  getNewProducts,
  getPartnerBrands,
  getPopularProducts,
  getPromoProducts,
  getRootCategories,
  getServices,
  getSettings,
  getShops,
} from '@/lib/data'
import { formatNumber, telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const revalidate = 300

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return {
    title: settings.seo_title ?? 'Pièces détachées moto au Burkina Faso | SR Faso',
    description: settings.seo_description ?? undefined,
    keywords: settings.seo_keywords ?? undefined,
    alternates: { canonical: '/' },
    openGraph: {
      title: settings.seo_title ?? settings.company_name,
      description: settings.seo_description ?? undefined,
      url: '/',
    },
  }
}

const ADVANTAGES = [
  {
    icon: PackageCheck,
    title: 'Stock disponible',
    text: 'Les pièces d’usage courant sont en rayon dans nos deux boutiques de Ouagadougou.',
  },
  {
    icon: Headset,
    title: 'Conseil technique',
    text: 'Notre équipe vous aide à choisir la référence compatible avec votre moto.',
  },
  {
    icon: Truck,
    title: 'Livraison au Faso',
    text: 'Livraison à Ouagadougou et expédition vers Bobo-Dioulasso et les autres villes.',
  },
  {
    icon: MessageCircle,
    title: 'Commande rapide',
    text: 'Commandez sur le site ou directement sur WhatsApp, sans créer de compte.',
  },
  {
    icon: Wrench,
    title: 'Atelier mécanique',
    text: 'Diagnostic, réparation moteur, transmission, électricité et entretien.',
  },
  {
    icon: ShieldCheck,
    title: 'Pièces sélectionnées',
    text: 'Des références choisies pour leur résistance aux conditions locales.',
  },
]

export default async function HomePage() {
  const [
    settings,
    categories,
    counts,
    featured,
    news,
    promos,
    popular,
    shops,
    services,
    brands,
    promo,
  ] = await Promise.all([
    getSettings(),
    getRootCategories(),
    getCategoryCounts(),
    getFeaturedProducts(10),
    getNewProducts(10),
    getPromoProducts(10),
    getPopularProducts(10),
    getShops(),
    getServices(),
    getPartnerBrands(),
    getHomePromo(),
  ])

  const promoProducts = await getHomePromoProducts(promo?.product_ids ?? [])

  // Mosaïque de la bannière : visuels gérés au back-office, sinon les produits populaires.
  const heroProducts = popular.length ? popular : featured
  const heroTiles = settings.home_hero_tiles.length
    ? settings.home_hero_tiles.map((tile, i) => ({
        key: `tile-${i}`,
        image: tile.url,
        alt: tile.label ?? settings.company_name,
        label: tile.label,
        href: tile.href,
      }))
    : heroProducts.slice(0, 4).map((p) => ({
        key: p.id,
        image: p.images?.[0]?.url ?? null,
        alt: p.images?.[0]?.alt ?? p.name,
        label: p.name,
        href: `/produits/${p.slug}`,
      }))

  // Fond de la bannière : rouge de la marque par défaut, noir en option.
  const heroDark = settings.home_hero_bg === 'dark'
  const heroTheme = heroDark
    ? {
        section: 'bg-ink-950 text-white',
        subtitle: 'text-ink-300',
        cta: 'bg-brand-600 text-white hover:bg-brand-700',
        placeholder: 'border-white/10 text-ink-400',
      }
    : {
        section: 'bg-brand-600 text-white',
        subtitle: 'text-white/85',
        cta: 'bg-white text-brand-700 hover:bg-brand-50',
        placeholder: 'border-white/25 text-white/80',
      }

  return (
    <>
      {/* Bannière principale */}
      <section className={heroTheme.section}>
        <div className="container-page grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div>
            <h1 className="font-display text-4xl leading-[1.08] font-extrabold sm:text-5xl lg:text-[3.5rem]">
              {settings.home_hero_title ?? 'Toutes les pièces de votre moto, au même endroit'}
            </h1>
            <p className={`mt-5 max-w-xl text-[1.0625rem] leading-relaxed ${heroTheme.subtitle}`}>
              {settings.home_hero_subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/produits"
                className={`inline-flex h-12 items-center gap-2 rounded-lg px-7 text-[0.9375rem] font-bold transition-colors ${heroTheme.cta}`}
              >
                Voir les produits
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {settings.whatsapp && (
                <a
                  href={whatsappLink(settings.whatsapp, settings.whatsapp_message ?? undefined)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#25D366] px-7 text-[0.9375rem] font-bold whitespace-nowrap text-white transition-opacity hover:opacity-90"
                >
                  Commander sur
                  <WhatsAppIcon className="size-5" />
                  <span className="sr-only">WhatsApp</span>
                </a>
              )}
            </div>
          </div>

          <div className="relative">
            {settings.home_hero_video ? (
              <video
                src={settings.home_hero_video}
                poster={settings.home_hero_image ?? undefined}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={settings.company_name}
                className="aspect-[4/3] w-full rounded-3xl bg-black/20 object-cover"
              />
            ) : settings.home_hero_image ? (
              <Image
                src={settings.home_hero_image}
                alt={settings.company_name}
                width={720}
                height={540}
                priority
                className="w-full rounded-3xl object-cover"
              />
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {heroTiles.map((tile) => {
                  const content = (
                    <>
                      <span className="relative block aspect-square bg-white">
                        {tile.image ? (
                          <Image
                            src={tile.image}
                            alt={tile.alt}
                            fill
                            sizes="(min-width:1024px) 22vw, 45vw"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : null}
                      </span>
                      {tile.label && (
                        <span className="block truncate px-3 py-2.5 text-sm font-medium">
                          {tile.label}
                        </span>
                      )}
                    </>
                  )
                  const className =
                    'group block overflow-hidden rounded-2xl bg-white/5 ring-1 ring-white/10'
                  return tile.href ? (
                    <Link key={tile.key} href={tile.href} className={className}>
                      {content}
                    </Link>
                  ) : (
                    <div key={tile.key} className={className}>
                      {content}
                    </div>
                  )
                })}
                {heroTiles.length === 0 && (
                  <div
                    className={`col-span-2 rounded-2xl border p-10 text-center text-sm ${heroTheme.placeholder}`}
                  >
                    Ajoutez les visuels de la bannière depuis le back-office (Paramètres › Page
                    d’accueil) ou publiez vos premiers produits.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Catégories principales */}
      {categories.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading
            eyebrow="Catalogue"
            title="Catégories principales"
            href="/categories"
          />
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.slice(0, 12).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="group flex h-full flex-col items-center gap-3 rounded-2xl border border-ink-100 p-5 text-center transition-all hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="grid size-14 place-items-center rounded-2xl bg-ink-50 text-ink-800 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                    <CategoryIcon name={c.icon} className="size-7" />
                  </span>
                  <span className="text-sm leading-snug font-semibold text-ink-900">{c.name}</span>
                  {counts[c.id] ? (
                    <span className="text-xs text-ink-400">
                      {formatNumber(counts[c.id])} produit{counts[c.id] > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Produits populaires */}
      {popular.length > 0 && (
        <section className="container-page py-8">
          <SectionHeading
            eyebrow="Les plus demandés"
            title="Nos produits populaires"
            href="/produits?tri=populaires"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {popular.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Nouveautés */}
      {news.length > 0 && (
        <section className="container-page py-8">
          <SectionHeading
            eyebrow="Arrivages"
            title="Nouveaux arrivages"
            href="/produits?nouveautes=1"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {news.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Promotions */}
      {promos.length > 0 && (
        <section className="mt-8 bg-brand-50/60 py-14">
          <div className="container-page">
            <SectionHeading
              eyebrow="Bons plans"
              title="Promotions en cours"
              href="/produits?promo=1"
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
              {promos.slice(0, 10).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Offre du moment (gérée au back-office) */}
      {promo?.is_active && (promo.title || promo.image_url) && (
        <HomePromoSection promo={promo} products={promoProducts} />
      )}

      {/* Sélection de la boutique */}
      {featured.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading
            eyebrow="Recommandé par notre équipe"
            title="Notre sélection"
            href="/produits"
          />
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            {featured.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Avantages */}
      <section className="border-y border-ink-100 bg-ink-50/60 py-14">
        <div className="container-page">
          <SectionHeading eyebrow="Pourquoi SR Faso" title="Ce que nous vous apportons" />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ADVANTAGES.map(({ icon: Icon, title, text }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl border border-ink-100 bg-white p-5"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" strokeWidth={1.8} aria-hidden />
                </span>
                <span>
                  <span className="block text-[0.9375rem] font-bold text-ink-900">{title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-500">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Boutiques */}
      {shops.length > 0 && (
        <section className="container-page py-14">
          <SectionHeading eyebrow="Points de vente" title="Nos boutiques" href="/boutiques" linkLabel="Voir nos boutiques" />
          <div className="grid gap-4 md:grid-cols-2">
            {shops.slice(0, 2).map((shop) => (
              <article key={shop.id} className="rounded-2xl border border-ink-100 p-6">
                <h3 className="text-lg font-bold text-ink-900">{shop.name}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-ink-500">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                  {shop.address}
                </p>
                {shop.hours && <p className="mt-1 text-sm text-ink-500">{shop.hours}</p>}
                <div className="mt-5 flex flex-wrap gap-2">
                  {shop.phone && (
                    <a
                      href={telLink(shop.phone)}
                      className="rounded-full border border-ink-200 px-4 py-2 text-sm font-semibold text-ink-800 hover:border-ink-900"
                    >
                      Appeler
                    </a>
                  )}
                  {shop.whatsapp && (
                    <a
                      href={whatsappLink(shop.whatsapp)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white"
                    >
                      <WhatsAppIcon className="size-4" />
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href="/boutiques"
                    className="rounded-full bg-gradient-to-br from-brand-600 to-brand-800 transition-[background-image] hover:from-brand-500 hover:to-brand-700 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Itinéraire
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Mécanique */}
      {services.length > 0 && (
        <section className="bg-ink-950 py-14 text-white">
          <div className="container-page">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-bold tracking-[0.16em] text-brand-500 uppercase">
                  Atelier
                </p>
                <h2 className="text-2xl font-extrabold sm:text-[1.75rem]">Services de mécanique</h2>
              </div>
              <Link
                href="/mecanique"
                className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-300 hover:text-white sm:flex"
              >
                Découvrir <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {services.slice(0, 8).map((s) => (
                <li key={s.id}>
                  <Link
                    href="/mecanique"
                    className="flex h-full flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-brand-500"
                  >
                    <CategoryIcon name={s.icon} className="size-6 text-brand-500" />
                    <span className="text-[0.9375rem] font-bold">{s.title}</span>
                    <span className="text-sm leading-relaxed text-ink-400">{s.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Marques partenaires */}
      {brands.length > 0 && (
        <section className="border-t border-ink-100 py-14">
          <div className="container-page">
            {settings.home_brands_title && (
              <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">
                {settings.home_brands_title}
              </h2>
            )}
            {settings.home_brands_intro && (
              <p className="mt-4 max-w-3xl text-[0.9375rem] leading-relaxed text-ink-500">
                {settings.home_brands_intro}
              </p>
            )}
            <div className="mt-12">
              <BrandStrip brands={brands} />
            </div>
          </div>
        </section>
      )}

      {/* Bloc SEO rédactionnel */}
      {settings.home_seo_content && (
        <section className="container-page py-14">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-2xl font-extrabold text-ink-900">
              Pièces détachées moto au Burkina Faso
            </h2>
            <div className="prose-sr mt-4">
              {settings.home_seo_content.split('\n\n').map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
