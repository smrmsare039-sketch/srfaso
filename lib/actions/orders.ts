'use server'

import QRCode from 'qrcode'
import { getCurrentProfile } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { canIssueReceipt, orderConfirmationMessage } from '@/lib/orders'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { OrderStatus, OrderWithItems, SiteSettings } from '@/lib/types'
import { whatsappLink } from '@/lib/utils'
import { SITE_URL } from '@/app/layout'

export type OrderFetchResult<T> = { ok: true; data: T } | { ok: false; error: string }

export type ReceiptPayload = {
  order: OrderWithItems
  settings: SiteSettings
  qrDataUrl: string | null
  /** Message de confirmation prêt à envoyer au client. */
  whatsappHref: string
}

async function guard() {
  const profile = await getCurrentProfile()
  if (!profile) throw new Error('Accès refusé.')
}

async function loadOrder(id: string): Promise<OrderWithItems | null> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .eq('id', id)
    .maybeSingle()
  return (data as OrderWithItems) ?? null
}

/** Détail d'une commande, chargé à la demande dans une boîte de dialogue. */
export async function fetchOrderDetail(id: string): Promise<OrderFetchResult<OrderWithItems>> {
  await guard()
  try {
    const order = await loadOrder(id)
    if (!order) return { ok: false, error: 'Cette commande est introuvable.' }
    return { ok: true, data: order }
  } catch {
    return { ok: false, error: 'Le chargement de la commande a échoué. Réessayez.' }
  }
}

/** Ticket 80 mm : commande, paramètres de la boutique et QR code. */
export async function fetchOrderReceipt(id: string): Promise<OrderFetchResult<ReceiptPayload>> {
  await guard()
  try {
    const [order, settings] = await Promise.all([loadOrder(id), getSettings()])
    if (!order) return { ok: false, error: 'Cette commande est introuvable.' }
    if (!canIssueReceipt(order.status as OrderStatus)) {
      return { ok: false, error: 'Le reçu est disponible une fois la commande confirmée.' }
    }

    // Le QR mène au suivi public de la commande, pré-rempli avec sa référence.
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

    return {
      ok: true,
      data: {
        order,
        settings,
        qrDataUrl,
        whatsappHref: whatsappLink(
          order.phone,
          orderConfirmationMessage(order, order.items ?? [], settings.company_name)
        ),
      },
    }
  } catch {
    return { ok: false, error: 'Le reçu n’a pas pu être préparé. Réessayez.' }
  }
}
