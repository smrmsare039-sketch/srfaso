import { CartProvider } from '@/components/cart-provider'
import { CategoryRail } from '@/components/category-rail'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { WhatsAppFloat } from '@/components/whatsapp-float'
import { getRootCategories, getSettings } from '@/lib/data'
import { SITE_URL } from '@/app/layout'

export default async function PublicLayout({ children }: LayoutProps<'/'>) {
  const [settings, categories] = await Promise.all([getSettings(), getRootCategories()])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${SITE_URL}/#organization`,
    name: settings.company_name,
    description: settings.tagline ?? undefined,
    url: SITE_URL,
    telephone: [settings.phone_primary, settings.phone_secondary].filter(Boolean),
    email: settings.email ?? undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: settings.address ?? undefined,
      addressLocality: 'Ouagadougou',
      addressCountry: 'BF',
    },
    areaServed: ['Ouagadougou', 'Bobo-Dioulasso', 'Burkina Faso'],
    openingHours: settings.hours ?? undefined,
    sameAs: [
      settings.facebook_url,
      settings.tiktok_url,
      settings.instagram_url,
      settings.youtube_url,
    ].filter(Boolean),
  }

  return (
    <CartProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CategoryRail categories={categories} />
      <div className="flex min-h-screen flex-col lg:pl-[var(--rail-width)]">
        <SiteHeader settings={settings} categories={categories} />
        <main className="flex-1">{children}</main>
        <SiteFooter settings={settings} categories={categories} />
      </div>
      <WhatsAppFloat number={settings.whatsapp} message={settings.whatsapp_message} />
    </CartProvider>
  )
}
