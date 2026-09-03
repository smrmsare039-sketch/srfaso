import Link from 'next/link'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { MAIN_NAV } from '@/lib/nav'
import type { Category, SiteSettings } from '@/lib/types'
import { telLink } from '@/lib/utils'

export function SiteFooter({
  settings,
  categories,
}: {
  settings: SiteSettings
  categories: Category[]
}) {
  const year = new Date().getFullYear()
  const socials = [
    { href: settings.facebook_url, label: 'Facebook' },
    { href: settings.tiktok_url, label: 'TikTok' },
    { href: settings.instagram_url, label: 'Instagram' },
    { href: settings.youtube_url, label: 'YouTube' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href))

  return (
    <footer className="mt-20 bg-ink-950 text-ink-300">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="inline-block rounded-2xl bg-white p-3">
            <BrandLogo className="h-20" />
          </span>
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            {settings.tagline ??
              'Pièces détachées, accessoires et mécanique moto au Burkina Faso.'}
          </p>
          {socials.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2">
              {socials.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-ink-800 px-3 py-1.5 text-xs font-semibold text-ink-200 transition-colors hover:border-brand-500 hover:text-white"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-sm font-bold tracking-wider text-white uppercase">Navigation</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-brand-400">
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/suivi" className="transition-colors hover:text-brand-400">
                Suivre ma commande
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold tracking-wider text-white uppercase">Catégories</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {categories.slice(0, 8).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/categories/${c.slug}`}
                  className="transition-colors hover:text-brand-400"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm font-bold tracking-wider text-white uppercase">Contact</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {settings.address && (
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.phone_primary && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                <span className="flex flex-col">
                  <a href={telLink(settings.phone_primary)} className="hover:text-brand-400">
                    {settings.phone_primary}
                  </a>
                  {settings.phone_secondary && (
                    <a href={telLink(settings.phone_secondary)} className="hover:text-brand-400">
                      {settings.phone_secondary}
                    </a>
                  )}
                </span>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                <a href={`mailto:${settings.email}`} className="hover:text-brand-400">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.hours && (
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
                <span>{settings.hours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-ink-800">
        <div className="container-page flex flex-col gap-2 py-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.company_name}. Tous droits réservés.
          </p>
          <p>Ouagadougou · Bobo-Dioulasso · Burkina Faso</p>
        </div>
      </div>
    </footer>
  )
}
