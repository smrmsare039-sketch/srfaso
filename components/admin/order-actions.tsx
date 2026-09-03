'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { inputClass, textareaClass } from '@/components/admin/ui'
import { ConfirmModal } from '@/components/admin/modal'
import { useToast } from '@/components/toast'
import { deleteOrder, updateOrderDelivery, updateOrderStatus } from '@/lib/actions/admin'
import { ORDER_STATUS_LABELS, type OrderStatus } from '@/lib/types'

export function OrderActions({
  orderId,
  status,
  deliveryFee,
  adminNote,
}: {
  orderId: string
  status: OrderStatus
  deliveryFee: number
  adminNote: string | null
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState<OrderStatus>(status)
  const [fee, setFee] = useState(String(deliveryFee))
  const [note, setNote] = useState(adminNote ?? '')
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-800">
          Statut de la commande
        </label>
        <select
          value={value}
          onChange={(e) => setValue(e.target.value as OrderStatus)}
          className={inputClass}
        >
          {Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-800">
          Frais de livraison (FCFA)
        </label>
        <input
          type="number"
          min={0}
          step="1"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-ink-800">Note interne</label>
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={textareaClass}
        />
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const parsedFee = Math.max(0, Number(fee) || 0)
            try {
              const deliveryResult = await updateOrderDelivery(orderId, parsedFee)
              const statusResult = await updateOrderStatus(orderId, value, note)
              const failure = !deliveryResult.ok
                ? deliveryResult
                : !statusResult.ok
                  ? statusResult
                  : null
              if (failure) {
                toast.error('Mise à jour impossible', {
                  key: 'commande-admin',
                  description: failure.error,
                })
                router.refresh()
                return
              }
            } catch {
              toast.error('Mise à jour impossible', {
                key: 'commande-admin',
                description: 'La commande n’a pas pu être enregistrée. Réessayez.',
              })
              return
            }
            toast.success('Commande mise à jour', {
              key: 'commande-admin',
              description: `Statut : ${ORDER_STATUS_LABELS[value]} — livraison ${parsedFee.toLocaleString('fr-FR')} FCFA.`,
            })
            router.refresh()
          })
        }
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-ink-900 hover:bg-brand-700 disabled:opacity-60"
      >
        <Save className="size-4" />
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>

      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ink-200 text-sm font-semibold text-ink-500 hover:border-brand-400 hover:text-brand-900"
      >
        <Trash2 className="size-4" />
        Supprimer la commande
      </button>

      <ConfirmModal
        open={confirming}
        pending={pending}
        title="Supprimer cette commande ?"
        description="La commande et son détail seront définitivement effacés. Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteOrder(orderId)
            if (!result.ok) {
              toast.error('Suppression impossible', {
                key: 'commande-admin',
                description: result.error,
              })
              return
            }
            toast.success('Commande supprimée', {
              key: 'commande-admin',
              description: 'Elle n’apparaît plus dans la liste des commandes.',
            })
            router.push('/admin/commandes')
          })
        }
      />
    </div>
  )
}
