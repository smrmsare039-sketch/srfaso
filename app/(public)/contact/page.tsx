import type { Metadata } from 'next'
import Link from 'next/link'
import { Clock, Mail, MapPin, Phone, Store } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ContactForm } from '@/components/contact-form'
import { getSettings, getShops } from '@/lib/data'
import { telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Contact — SUPER & RESISTANT à Ouagadougou',
  description:
    'Contactez SUPER & RESISTANT : téléphone, WhatsApp, e-mail et adresse à Ouagadougou. Nous répondons à vos questions sur les pièces moto et la mécanique.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const [settings, shops] = await Promise.all([getSettings(), getShops()])

  const socials = [
    { href: settings.facebook_url, label: 'Facebook' },
    { href: settings.tiktok_url, label: 'TikTok' },
    { href: settings.instagram_url, label: 'Instagram' },
    { href: settings.youtube_url, label: 'YouTube' },
  ].filter((s): s is { href: string; label: string } => Boolean(s.href))

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Contact' }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">Nous contacter</h1>
        <p className="mt-3 text-ink-500">
          Une question sur une pièce, une compatibilité, un délai de livraison ou une intervention
          en atelier ? Écrivez-nous ou appelez-nous directement.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-ink-100 p-6">
            <h2 className="text-lg font-bold text-ink-900">Informations de contact</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {settings.phone_primary && (
                <li className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Phone className="size-4" aria-hidden />
                  </span>
                  <span className="flex flex-col gap-0.5 pt-1.5">
                    <a
                      href={telLink(settings.phone_primary)}
                      className="font-semibold text-ink-900 hover:text-brand-600"
                    >
                      {settings.phone_primary}
                    </a>
                    {settings.phone_secondary && (
                      <a
                        href={telLink(settings.phone_secondary)}
                        className="font-semibold text-ink-900 hover:text-brand-600"
                      >
                        {settings.phone_secondary}
                      </a>
                    )}
                  </span>
                </li>
              )}
              {settings.email && (
                <li className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Mail className="size-4" aria-hidden />
                  </span>
                  <a
                    href={`mailto:${settings.email}`}
                    className="pt-2 font-semibold text-ink-900 hover:text-brand-600"
                  >
                    {settings.email}
                  </a>
                </li>
              )}
              {settings.address && (
                <li className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <MapPin className="size-4" aria-hidden />
                  </span>
                  <span className="pt-2 text-ink-700">{settings.address}</span>
                </li>
              )}
              {settings.hours && (
                <li className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                    <Clock className="size-4" aria-hidden />
                  </span>
                  <span className="pt-2 text-ink-700">{settings.hours}</span>
                </li>
              )}
            </ul>

            {settings.whatsapp && (
              <a
                href={whatsappLink(settings.whatsapp, settings.whatsapp_message ?? undefined)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3.5 text-[0.9375rem] font-bold text-white"
              >
                <WhatsAppIcon className="size-5" />
                Discuter avec nous
              </a>
            )}

            {socials.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full border border-ink-200 px-3.5 py-1.5 text-xs font-semibold text-ink-700 hover:border-brand-500 hover:text-brand-600"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {shops.length > 0 && (
            <section className="rounded-2xl border border-ink-100 p-6">
              <h2 className="text-lg font-bold text-ink-900">Nos boutiques</h2>
              <ul className="mt-4 space-y-4">
                {shops.map((shop) => (
                  <li key={shop.id} className="flex gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ink-50 text-ink-700">
                      <Store className="size-4" aria-hidden />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-ink-900">{shop.name}</span>
                      <span className="block text-sm text-ink-500">{shop.address}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/boutiques"
                className="mt-5 inline-block text-sm font-semibold text-brand-600 hover:underline"
              >
                Voir les boutiques et itinéraires →
              </Link>
            </section>
          )}
        </div>

        <section className="rounded-2xl border border-ink-100 p-6 sm:p-8">
          <h2 className="text-lg font-bold text-ink-900">Envoyez-nous un message</h2>
          <p className="mt-1.5 mb-6 text-sm text-ink-500">
            Les champs marqués d’une <span className="text-brand-600">*</span> sont obligatoires.
          </p>
          <ContactForm />
        </section>
      </div>
    </div>
  )
}
