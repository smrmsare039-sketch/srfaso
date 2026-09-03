import type { Metadata } from 'next'
import { RotateCcw, Truck } from 'lucide-react'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { RichText } from '@/components/rich-text'
import { getDeliveryContent, getSettings } from '@/lib/data'
import { whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const revalidate = 600

export async function generateMetadata(): Promise<Metadata> {
  const content = await getDeliveryContent()
  return {
    title: content?.seo_title ?? 'Livraison et retour',
    description:
      content?.seo_description ??
      'Zones desservies, délais, coûts de livraison et procédure de retour chez SUPER & RESISTANT au Burkina Faso.',
    alternates: { canonical: '/livraison-retour' },
  }
}

export default async function DeliveryPage() {
  const [content, settings] = await Promise.all([getDeliveryContent(), getSettings()])

  return (
    <div className="container-page pb-16">
      <Breadcrumbs items={[{ label: 'Livraison & Retour' }]} />

      <header className="mb-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">Livraison &amp; Retour</h1>
        <p className="mt-3 text-ink-500">
          Nos conditions de livraison et de retour, applicables à toutes les commandes passées sur
          le site, par téléphone ou sur WhatsApp.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-ink-100 p-7 sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-800">
            <Truck className="size-6" strokeWidth={1.7} aria-hidden />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
            {content?.delivery_title ?? 'Livraison'}
          </h2>
          {content?.delivery_body ? (
            <RichText content={content.delivery_body} className="prose-sr mt-4" />
          ) : (
            <p className="mt-4 text-ink-500">
              Le contenu de cette section est administrable depuis le back-office.
            </p>
          )}
        </section>

        <section className="rounded-3xl border border-ink-100 p-7 sm:p-9">
          <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-800">
            <RotateCcw className="size-6" strokeWidth={1.7} aria-hidden />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-ink-900">
            {content?.return_title ?? 'Retour'}
          </h2>
          {content?.return_body ? (
            <RichText content={content.return_body} className="prose-sr mt-4" />
          ) : (
            <p className="mt-4 text-ink-500">
              Le contenu de cette section est administrable depuis le back-office.
            </p>
          )}
        </section>
      </div>

      {settings.whatsapp && (
        <section className="mt-10 flex flex-col items-start justify-between gap-5 rounded-3xl bg-ink-950 p-8 text-white sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-xl font-extrabold">Une question sur votre livraison ?</h2>
            <p className="mt-2 text-ink-300">
              Notre équipe vous répond directement sur WhatsApp.
            </p>
          </div>
          <a
            href={whatsappLink(settings.whatsapp, settings.whatsapp_message ?? undefined)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-[0.9375rem] font-bold text-white"
          >
            <WhatsAppIcon className="size-4" />
            Écrire sur WhatsApp
          </a>
        </section>
      )}
    </div>
  )
}
