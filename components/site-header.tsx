import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone } from 'lucide-react'
import { AccountButton } from '@/components/account/account-button'
import { AutoHideHeader } from '@/components/auto-hide-header'
import { BrandLogo } from '@/components/brand-logo'
import { CartButton } from '@/components/cart-button'
import { MainNav, MobileNav } from '@/components/main-nav'
import { SearchBox } from '@/components/search-box'
import { FacebookIcon, TikTokIcon } from '@/components/social-icons'
import type { SiteSettings } from '@/lib/types'
import { telLink } from '@/lib/utils'

export function SiteHeader({ settings }: { settings: SiteSettings }) {
  const phone = settings.phone_primary
  const whatsapp = settings.whatsapp ?? settings.phone_primary

  return (
    <AutoHideHeader>
      {/* Bandeau de contact */}
      <div className="hidden bg-ink-900 text-ink-100 lg:block">
        <div className="container-header flex h-9 items-center justify-between text-[0.8125rem]">
          <div className="flex items-center gap-5">
            {settings.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5 text-brand-500" aria-hidden />
                {settings.address}
              </span>
            )}
            {settings.facebook_url && (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="transition-colors hover:text-white"
              >
                <FacebookIcon className="size-4" />
              </a>
            )}
            {settings.tiktok_url && (
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="transition-colors hover:text-white"
              >
                <TikTokIcon className="size-4" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-5">
            {phone && (
              <a href={telLink(phone)} className="flex items-center gap-1.5 hover:text-white">
                <Phone className="size-3.5 text-brand-500" aria-hidden />
                {phone}
              </a>
            )}
            {settings.phone_secondary && (
              <a
                href={telLink(settings.phone_secondary)}
                className="hover:text-white"
              >
                {settings.phone_secondary}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Barre principale */}
      <div className="border-b border-ink-100">
        <div className="container-header flex h-20 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Accueil SR Faso">
            {settings.logo_url ? (
              <Image
                src={settings.logo_url}
                alt={settings.company_name}
                width={168}
                height={44}
                priority
                className="h-11 w-auto object-contain"
              />
            ) : (
              <>
                <BrandLogo priority className="h-14" />
                <span className="mt-0.5 hidden font-display text-[0.6875rem] leading-none font-medium tracking-[0.18em] text-ink-400 uppercase lg:block">
                  Pièces moto
                  <br />
                  Burkina Faso
                </span>
              </>
            )}
          </Link>

          <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />

          <div className="ml-auto flex items-center gap-2">
            <CartButton />
            <AccountButton />
            <MobileNav phone={phone} whatsapp={whatsapp} />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="border-b border-ink-100 bg-white">
        <div className="container-header flex min-h-12 items-center justify-between gap-4 py-2 md:py-0">
          <MainNav />
          <SearchBox className="w-full md:hidden" />
        </div>
      </div>
    </AutoHideHeader>
  )
}
