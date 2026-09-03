import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import QRCode from 'qrcode'
import { ReceiptToolbar } from '@/components/admin/receipt-toolbar'
import { ThermalReceipt } from '@/components/admin/thermal-receipt'
import { requireAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { canIssueReceipt, orderConfirmationMessage } from '@/lib/orders'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { OrderStatus, OrderWithItems } from '@/lib/types'
import { whatsappLink } from '@/lib/utils'
import { SITE_URL } from '@/app/layout'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reçu de commande',
  robots: { index: false, follow: false },
}

export default async function ReceiptPage(props: PageProps<'/admin/recu/[id]'>) {
  await requireAdmin()
  const { id } = await props.params

  const supabase = await createSupabaseServerClient()
  const [{ data }, settings] = await Promise.all([
    supabase.from('orders').select('*, items:order_items(*)').eq('id', id).maybeSingle(),
    getSettings(),
  ])

  const order = data as OrderWithItems | null
  if (!order) notFound()

  // Le reçu n'a de sens qu'à partir de la confirmation.
  if (!canIssueReceipt(order.status as OrderStatus)) {
    redirect(`/admin/commandes/${order.id}`)
  }

  const message = orderConfirmationMessage(order, order.items ?? [], settings.company_name)
  // Le QR mène au suivi public de la commande : utile collé sur le colis.
  let qrDataUrl: string | null = null
  try {
    qrDataUrl = await QRCode.toDataURL(
      `${SITE_URL}/suivi?ref=${encodeURIComponent(order.reference)}`,
      {
        margin: 0,
        width: 240,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      }
    )
  } catch {
    qrDataUrl = null
  }

  return (
    <div className="min-h-screen bg-ink-100 p-6 sm:p-10">
      <ReceiptToolbar
        orderId={order.id}
        reference={order.reference}
        whatsappHref={whatsappLink(order.phone, message)}
      />

      <p className="no-print mb-4 text-center text-sm font-semibold text-ink-500">
        Aperçu du ticket — thermique 80 mm
      </p>

      <div className="mx-auto w-fit bg-white shadow-card print:shadow-none">
        <ThermalReceipt
          order={order}
          settings={settings}
          qrDataUrl={qrDataUrl}
          qrCaption="Scannez pour suivre cette commande"
        />
      </div>

      <p className="no-print mx-auto mt-6 max-w-md text-center text-xs text-ink-400">
        À l’impression, choisissez le format 80 mm de votre imprimante thermique et désactivez les
        marges. Le ticket sort seul, sans l’interface.
      </p>
    </div>
  )
}
