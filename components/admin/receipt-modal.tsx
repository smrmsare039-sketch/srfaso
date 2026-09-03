'use client'

import { useEffect, useState } from 'react'
import { Loader2, Printer } from 'lucide-react'
import { Modal } from '@/components/admin/modal'
import { ThermalReceipt } from '@/components/admin/thermal-receipt'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { fetchOrderReceipt, type ReceiptPayload } from '@/lib/actions/orders'

export function ReceiptModal({
  orderId,
  reference,
  open,
  onClose,
}: {
  orderId: string
  reference: string
  open: boolean
  onClose: () => void
}) {
  // Le résultat porte l'identifiant chargé : changer de commande affiche donc
  // le chargement sans avoir à remettre l'état à zéro dans l'effet.
  const [loaded, setLoaded] = useState<{
    id: string
    payload?: ReceiptPayload
    error?: string
  } | null>(null)

  useEffect(() => {
    if (!open) return
    let active = true
    fetchOrderReceipt(orderId).then((result) => {
      if (!active) return
      setLoaded(
        result.ok ? { id: orderId, payload: result.data } : { id: orderId, error: result.error }
      )
    })
    return () => {
      active = false
    }
  }, [open, orderId])

  const current = loaded?.id === orderId ? loaded : null
  const payload = current?.payload ?? null
  const error = current?.error ?? null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Reçu ${reference}`}
      description="Ticket thermique 80 mm"
    >
      <div className="p-4 sm:p-5">
        {!payload && !error && (
          <div className="flex h-64 items-center justify-center text-ink-400">
            <Loader2 className="size-6 animate-spin" aria-hidden />
            <span className="sr-only">Préparation du reçu…</span>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700"
          >
            {error}
          </p>
        )}

        {payload && (
          <>
            <div className="rounded-xl bg-ink-100 p-4">
              <div className="mx-auto w-fit bg-white shadow-card">
                <ThermalReceipt
                  order={payload.order}
                  settings={payload.settings}
                  qrDataUrl={payload.qrDataUrl}
                  qrCaption="Scannez pour suivre cette commande"
                />
              </div>
            </div>

            <div className="pb-safe no-print mt-5 flex flex-col gap-2 sm:flex-row sm:pb-0">
              <a
                href={payload.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                <WhatsAppIcon className="size-4" />
                Envoyer au client
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                <Printer className="size-4" aria-hidden />
                Imprimer
              </button>
            </div>

            <p className="no-print mt-3 text-center text-xs text-ink-400">
              À l’impression, choisissez le format 80 mm et désactivez les marges : seul le ticket
              sort.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}
