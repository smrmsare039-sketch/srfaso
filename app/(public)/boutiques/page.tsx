import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Clock, MapPin, Navigation, PackageCheck, Phone, Store, Wrench } from 'lucide-react'
import { SITE_URL } from '@/app/layout'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getSettings, getShops } from '@/lib/data'
import { telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Nos boutiques à Ouagadougou',
  description:
    'Retrouvez SUPER & RESISTANT dans ses boutiques de Ouagadougou : Rue 7.07 à Samandin et au Marché du cycle. Horaires, téléphone, WhatsApp et itinéraire.',
  alternates: { canonical: '/boutiques' },
}

const HIGHLIGHTS = [
  { icon: Store, title: 'Boutique principale', text: 'Pièces et accessoires en rayon' },
  { icon: PackageCheck, title: 'Point de retrait', text: 'Récupérez vos commandes sur place' },
  { icon: Wrench, title: 'Conseils et assistance', text: 'Une équipe mécanique à votre écoute' },
]

function mapsUrl(shop: {
  latitude: number | null
  longitude: number | null
  address: string | null
  name: string
  map_url: string | null
}) {
  if (shop.map_url) return shop.map_url
  if (shop.latitude != null && shop.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}`
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${shop.name} ${shop.address ?? ''} Ouagadougou`
  )}`
}

export default async function ShopsPage() {
  const [shops, settings] = await Promise.all([getShops(), getSettings()])

  const heroImage = settings.og_image_url ?? shops.find((s) => s.image_url)?.image_url ?? null

  const jsonLd = shops.map((shop) => ({
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/boutiques#${shop.slug}`,
    name: `${settings.company_name} — ${shop.name}`,
    image: shop.image_url ?? undefined,
    telephone: shop.phone ?? undefined,
    openingHours: shop.hours ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: shop.address ?? undefined,
      addressLocality: shop.city ?? 'Ouagadougou',
      addressCountry: 'BF',
    },
    geo:
      shop.latitude != null && shop.longitude != null
        ? { '@type': 'GeoCoordinates', latitude: shop.latitude, longitude: shop.longitude }
        : undefined,
  }))

  return (
    <div className="container-page pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Breadcrumbs items={[{ label: 'Boutiques' }]} />

      {/* Bandeau rouge */}
      <section className="overflow-hidden rounded-3xl bg-brand-600 text-white">
        <div className="grid items-center gap-8 p-7 sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {shops.length === 2 ? 'Nos deux boutiques' : 'Nos boutiques'}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85">
              Retrouvez {settings.company_name} dans nos points de vente au Burkina Faso. Nos
              boutiques vous permettent d’acheter directement vos pièces et accessoires moto, de
              bénéficier de conseils professionnels et de trouver rapidement les produits adaptés à
              votre moto.
            </p>
            <ul className="mt-7 grid gap-3 sm:grid-cols-3">
              {HIGHLIGHTS.map((item) => (
                <li key={item.title} className="rounded-2xl bg-white/12 p-4">
                  <item.icon className="size-5" strokeWidth={1.7} aria-hidden />
                  <p className="mt-3 text-sm font-bold">{item.title}</p>
                  <p className="mt-1 text-xs text-white/80">{item.text}</p>
                </li>
              ))}
            </ul>
          </div>

          {heroImage && (
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white/10">
              <Image
                src={heroImage}
                alt={settings.company_name}
                fill
                sizes="(min-width:1024px) 35vw, 100vw"
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Boutiques */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-extrabold text-ink-900">
          Nos boutiques {settings.company_name} au Burkina Faso
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-relaxed text-ink-500">
          {settings.company_name} dispose de boutiques physiques spécialisées dans la vente de
          pièces et accessoires moto au Burkina Faso. Nous proposons des produits fiables, adaptés
          aux motos utilisées localement, avec un accompagnement professionnel pour chaque client.
        </p>

        {shops.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-ink-200 py-16 text-center text-ink-500">
            Les boutiques seront affichées dès leur création dans le back-office.
          </p>
        ) : (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {shops.map((shop) => (
              <article
                key={shop.id}
                id={shop.slug}
                className="overflow-hidden rounded-3xl border border-ink-100 bg-white"
              >
                {/* Média : vidéo de fond, photo en repli */}
                <div className="relative aspect-[16/9] bg-ink-900">
                  {shop.video_url ? (
                    <video
                      src={shop.video_url}
                      poster={shop.image_url ?? undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      aria-label={`${settings.company_name} — ${shop.name}`}
                      className="size-full object-cover"
                    />
                  ) : shop.image_url ? (
                    <Image
                      src={shop.image_url}
                      alt={shop.name}
                      fill
                      sizes="(min-width:1024px) 45vw, 100vw"
                      className="object-cover"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-white/40">
                      <Store className="size-12" strokeWidth={1.2} aria-hidden />
                    </span>
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/25 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <h3 className="font-display text-xl font-extrabold text-white sm:text-2xl">
                      {settings.company_name} — {shop.name}
                    </h3>
                    <Link
                      href="/produits"
                      className="mt-4 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700"
                    >
                      Voir les produits
                    </Link>
                  </div>
                </div>

                <div className="p-6">
                  {shop.description && (
                    <p className="text-sm leading-relaxed text-ink-500">{shop.description}</p>
                  )}

                  <ul className="mt-5 space-y-3 text-sm">
                    <li className="flex gap-2.5">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                      <span className="text-ink-700">
                        {shop.address}
                        {shop.district ? ` — ${shop.district}` : ''}
                        {shop.city ? `, ${shop.city}` : ''}
                      </span>
                    </li>
                    {shop.hours && (
                      <li className="flex gap-2.5">
                        <Clock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                        <span className="text-ink-700">{shop.hours}</span>
                      </li>
                    )}
                    {shop.phone && (
                      <li className="flex gap-2.5">
                        <Phone className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden />
                        <a href={telLink(shop.phone)} className="text-ink-700 hover:text-brand-600">
                          {shop.phone}
                        </a>
                      </li>
                    )}
                  </ul>

                  <div className="mt-6 flex flex-wrap gap-2">
                    {shop.phone && (
                      <a
                        href={telLink(shop.phone)}
                        className="flex items-center gap-2 rounded-xl border border-ink-200 px-4 py-2.5 text-sm font-semibold text-ink-800 hover:border-ink-900"
                      >
                        <Phone className="size-4" aria-hidden />
                        Appeler
                      </a>
                    )}
                    {(shop.whatsapp ?? settings.whatsapp) && (
                      <a
                        href={whatsappLink(shop.whatsapp ?? settings.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"
                      >
                        <WhatsAppIcon className="size-4" />
                        WhatsApp
                      </a>
                    )}
                    <a
                      href={mapsUrl(shop)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-ink-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
                    >
                      <Navigation className="size-4" aria-hidden />
                      Itinéraire
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Contenu éditorial */}
      <section className="mt-12 max-w-4xl space-y-4 text-sm leading-relaxed text-ink-500">
        <h2 className="font-display text-lg font-extrabold text-ink-900">
          {settings.company_name}, spécialiste des pièces moto au Burkina Faso
        </h2>
        <p>
          {settings.company_name} accompagne les conducteurs de motos, mécaniciens et professionnels
          du transport avec des pièces et accessoires fiables, adaptés aux réalités du Burkina Faso.
          Nos boutiques proposent une large gamme de produits : éclairage, embrayage, pièces moteur,
          systèmes électriques et accessoires pour motos.
        </p>
        <h3 className="pt-2 font-display text-base font-bold text-ink-900">
          Achetez facilement vos pièces moto, en boutique ou en ligne
        </h3>
        <p>
          Grâce à nos boutiques physiques et à notre boutique en ligne, vous pouvez trouver
          rapidement les pièces nécessaires à l’entretien et à la réparation de votre moto. Notre
          catalogue permet d’identifier facilement les produits adaptés à chaque modèle.
        </p>
        <p>
          Notre équipe reste disponible pour orienter les clients vers les meilleures solutions,
          avec un accompagnement fiable et des produits testés pour un usage intensif sur les routes
          locales.
        </p>
      </section>
    </div>
  )
}
