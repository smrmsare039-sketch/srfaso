'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/admin/modal'
import { useToast } from '@/components/toast'
import { deleteMessage, updateMessageStatus } from '@/lib/actions/admin'
import { MESSAGE_STATUS_LABELS, type MessageStatus } from '@/lib/types'
import { cx } from '@/lib/utils'

export function MessageActions({ id, status }: { id: string; status: MessageStatus }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {(Object.keys(MESSAGE_STATUS_LABELS) as MessageStatus[]).map((key) => (
        <button
          key={key}
          type="button"
          disabled={pending || key === status}
          onClick={() =>
            startTransition(async () => {
              const result = await updateMessageStatus(id, key)
              if (result.ok) {
                toast.success('Message mis à jour', {
                  key: 'message-admin',
                  description: `Nouveau statut : ${MESSAGE_STATUS_LABELS[key]}.`,
                })
              } else {
                toast.error('Mise à jour impossible', {
                  key: 'message-admin',
                  description: result.error,
                })
              }
              router.refresh()
            })
          }
          className={cx(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
            key === status
              ? 'bg-ink-900 text-white'
              : 'border border-ink-200 text-ink-600 hover:border-ink-400'
          )}
        >
          {MESSAGE_STATUS_LABELS[key]}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setConfirming(true)}
        title="Supprimer"
        className="grid size-8 place-items-center rounded-lg border border-ink-200 text-ink-400 hover:border-brand-400 hover:text-brand-600"
      >
        <Trash2 className="size-3.5" />
      </button>

      <ConfirmModal
        open={confirming}
        pending={pending}
        title="Supprimer ce message ?"
        description="Le message sera définitivement retiré de la boîte de réception."
        onClose={() => setConfirming(false)}
        onConfirm={() =>
          startTransition(async () => {
            const result = await deleteMessage(id)
            if (result.ok) {
              toast.success('Message supprimé', {
                key: 'message-admin',
                description: 'Il a été retiré de la boîte de réception.',
              })
            } else {
              toast.error('Suppression impossible', {
                key: 'message-admin',
                description: result.error,
              })
            }
            setConfirming(false)
            router.refresh()
          })
        }
      />
    </div>
  )
}
