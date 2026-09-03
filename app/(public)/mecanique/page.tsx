import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Phone } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { CategoryIcon } from '@/components/category-icon'
import { getServices, getSettings, getWorkshopGallery } from '@/lib/data'
import { telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { WorkshopGallery } from '@/components/workshop-gallery'

export const revalidate = 600

export const metadata: Metadata = {
  title: 'Mécanique moto à Ouagadougou',
  description:
    'Diagnostic, réparation moteur, transmission, embrayage, électricité, freinage et entretien : les services de mécanique moto de SUPER & RESISTANT à Ouagadougou.',
  alternates: { canonical: '/mecanique' },
}

export default async function MechanicPage() {
  const [services, settings, gallery] = await Promise.all([
    getServices(),
    getSettings(),
    getWorkshopGallery(),
  ])

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Mécanique' }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          Nos services de mécanique
        </h1>
        <p className="mt-3 text-ink-500">
          Notre atelier de Ouagadougou intervient sur les pannes courantes comme sur les réfections
          plus lourdes. Chaque intervention commence par un diagnostic afin de ne remplacer que ce
          qui doit l’être.
        </p>
      </header>

      {gallery.length > 0 && (
        <div className="mb-14">
          <WorkshopGallery
            photos={gallery}
            whatsapp={settings.whatsapp}
            phone={settings.phone_primary}
          />
        </div>
      )}

      <h2 className="mb-5 text-2xl font-extrabold text-ink-900 sm:text-3xl">
        Ce que nous prenons en charge
      </h2>

      {services.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink-200 py-16 text-center text-ink-500">
          Les prestations seront affichées dès leur création dans le back-office.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-ink-100"
            >
              {service.image_url && (
                <span className="relative block aspect-[16/9] bg-ink-50">
                  <Image
                    src={service.image_url}
                    alt={service.title}
                    fill
                    sizes="(min-width:1024px) 30vw, 100vw"
                    className="object-cover"
                  />
                </span>
              )}
              <div className="flex flex-1 flex-col p-6">
                <span className="grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-800">
                  <CategoryIcon name={service.icon} className="size-5" />
                </span>
                <h2 className="mt-4 text-lg font-bold text-ink-900">{service.title}</h2>
                {service.description && (
                  <p className="mt-1.5 text-sm font-medium text-ink-600">{service.description}</p>
                )}
                {service.details && (
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">{service.details}</p>
                )}
                {service.price_label && (
                  <p className="mt-3 text-sm font-bold text-brand-800">{service.price_label}</p>
                )}

                <div className="mt-auto flex flex-wrap gap-2 pt-6">
                  {settings.whatsapp && (
                    <a
                      href={whatsappLink(
                        settings.whatsapp,
                        `Bonjour SUPER & RESISTANT, je souhaite un rendez-vous pour : ${service.title}.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3.5 py-2.5 text-sm font-bold text-white"
                    >
                      <WhatsAppIcon className="size-4" />
                      WhatsApp
                    </a>
                  )}
                  <Link
                    href="/contact"
                    className="rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm font-semibold text-ink-800 hover:border-ink-900"
                  >
                    Prendre contact
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <section className="mt-14 rounded-3xl bg-ink-950 p-8 text-white sm:p-12">
        <h2 className="text-2xl font-extrabold">Une panne ? Parlons-en.</h2>
        <p className="mt-3 max-w-2xl text-ink-300">
          Décrivez-nous le symptôme (bruit, démarrage, fumée, perte de puissance) : nous vous
          indiquons la marche à suivre et le délai d’intervention.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {settings.phone_primary && (
            <a
              href={telLink(settings.phone_primary)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[0.9375rem] font-bold text-ink-900"
            >
              <Phone className="size-4" aria-hidden />
              {settings.phone_primary}
            </a>
          )}
          {settings.whatsapp && (
            <a
              href={whatsappLink(settings.whatsapp, settings.whatsapp_message ?? undefined)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[0.9375rem] font-bold text-white"
            >
              <WhatsAppIcon className="size-4" />
              Écrire sur WhatsApp
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
