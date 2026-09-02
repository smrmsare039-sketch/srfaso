import type { Order, OrderItem, OrderStatus } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

/**
 * Une commande confirmée (ou plus avancée) peut donner lieu à un reçu.
 * Une commande simplement reçue ou annulée n'en produit pas.
 */
export function canIssueReceipt(status: OrderStatus): boolean {
  return status !== 'nouvelle' && status !== 'annulee'
}

/** Message de confirmation envoyé au client sur WhatsApp. */
export function orderConfirmationMessage(
  order: Pick<Order, 'reference' | 'first_name' | 'city' | 'total' | 'delivery_fee' | 'subtotal'>,
  items: Pick<OrderItem, 'product_name' | 'quantity' | 'unit_price'>[] = [],
  companyName = 'SUPER & RESISTANT'
): string {
  const lines = [
    `Bonjour ${order.first_name}, ici ${companyName}.`,
    '',
    `Votre commande ${order.reference} est confirmée.`,
  ]

  if (items.length > 0) {
    lines.push('')
    for (const item of items) {
      lines.push(
        `• ${item.quantity} × ${item.product_name} — ${formatPrice(item.quantity * Number(item.unit_price))}`
      )
    }
  }

  lines.push('')
  if (Number(order.delivery_fee) > 0) {
    lines.push(`Sous-total : ${formatPrice(order.subtotal)}`)
    lines.push(`Livraison : ${formatPrice(order.delivery_fee)}`)
  }
  lines.push(`Total à payer : ${formatPrice(order.total)}`)
  lines.push(`Livraison à : ${order.city}`)
  lines.push('')
  lines.push('Merci pour votre confiance !')

  return lines.join('\n')
}
