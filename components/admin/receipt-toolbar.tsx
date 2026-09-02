'use client'

import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

/** Barre d'actions de l'aperçu du reçu — masquée à l'impression. */
export function ReceiptToolbar({
  orderId,
  reference,
  whatsappHref,
}: {
  orderId: string
  reference: string
  whatsappHref: string
}) {
  return (
    <div className="no-print mx-auto mb-6 flex w-full max-w-3xl flex-wrap items-center gap-3">
      <Link
        href={`/admin/commandes/${orderId}`}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-300"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Commande {reference}
      </Link>

      <div className="ml-auto flex flex-wrap gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          <WhatsAppIcon className="size-4" />
          Envoyer au client
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        >
          <Printer className="size-4" aria-hidden />
          Imprimer
        </button>
      </div>
    </div>
  )
}
