'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Eye, Receipt, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/admin/modal'
import { OrderDetailModal } from '@/components/admin/order-detail-modal'
import { ReceiptModal } from '@/components/admin/receipt-modal'
import { useToast } from '@/components/toast'
import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { deleteOrder } from '@/lib/actions/admin'
import { canIssueReceipt, orderConfirmationMessage } from '@/lib/orders'
import type { Order, OrderStatus } from '@/lib/types'
import { whatsappLink } from '@/lib/utils'

const action =
  'grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors'

export function OrderRowActions({
  order,
  companyName,
}: {
  order: Pick<
    Order,
    'id' | 'reference' | 'first_name' | 'phone' | 'city' | 'subtotal' | 'delivery_fee' | 'total'
  > & { status: OrderStatus }
  companyName: string
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [viewing, setViewing] = useState(false)
  const [receipt, setReceipt] = useState(false)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const receiptAvailable = canIssueReceipt(order.status)

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setViewing(true)}
        title="Voir la commande"
        aria-label={`Voir la commande ${order.reference}`}
        className={`${action} hover:border-brand-400 hover:text-brand-600`}
      >
        <Eye className="size-4" aria-hidden />
      </button>

      <a
        href={whatsappLink(order.phone, orderConfirmationMessage(order, [], companyName))}
        target="_blank"
        rel="noopener noreferrer"
        title="Envoyer la confirmation sur WhatsApp"
        aria-label={`Confirmer la commande ${order.reference} sur WhatsApp`}
        className={`${action} hover:border-[#25D366] hover:text-[#25D366]`}
      >
        <WhatsAppIcon className="size-4" />
      </a>

      {receiptAvailable ? (
        <button
          type="button"
          onClick={() => setReceipt(true)}
          title="Reçu thermique 80 mm"
          aria-label={`Reçu de la commande ${order.reference}`}
          className={`${action} hover:border-ink-900 hover:text-ink-900`}
        >
          <Receipt className="size-4" aria-hidden />
        </button>
      ) : (
        <span
          title="Le reçu est disponible une fois la commande confirmée."
          className={`${action} cursor-not-allowed opacity-40`}
        >
          <Receipt className="size-4" aria-hidden />
        </span>
      )}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Supprimer la commande"
        aria-label={`Supprimer la commande ${order.reference}`}
        className={`${action} hover:border-brand-400 hover:text-brand-600`}
      >
        <Trash2 className="size-4" aria-hidden />
      </button>

      <OrderDetailModal
        orderId={order.id}
        reference={order.reference}
        companyName={companyName}
        open={viewing}
        onClose={() => setViewing(false)}
      />

      <ReceiptModal
        orderId={order.id}
        reference={order.reference}
        open={receipt}
        onClose={() => setReceipt(false)}
      />

      <ConfirmModal
        open={confirming}
        pending={pending}
        title={`Supprimer la commande ${order.reference} ?`}
        description="La commande et son détail seront définitivement effacés. Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteOrder(order.id)
            if (!result.ok) {
              toast.error('Suppression impossible', {
                key: 'commande-admin',
                description: result.error,
              })
              return
            }
            setConfirming(false)
            toast.success('Commande supprimée', {
              key: 'commande-admin',
              description: `${order.reference} n’apparaît plus dans la liste.`,
            })
            router.refresh()
          })
        }
      />
    </div>
  )
}
