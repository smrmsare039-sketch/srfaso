'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Copy, Eye, EyeOff, Loader2, Pencil, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/toast'
import { deleteProduct, duplicateProduct, toggleProductActive } from '@/lib/actions/admin'

export function ProductRowActions({
  id,
  slug,
  name,
  isActive,
}: {
  id: string
  slug: string
  name: string
  isActive: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)
  const toast = useToast()

  const button =
    'grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:border-ink-400 hover:text-ink-900 disabled:opacity-50'

  return (
    <div className="flex items-center justify-end gap-1.5">
      {pending && <Loader2 className="size-4 animate-spin text-ink-400" />}

      <Link
        href={`/produits/${slug}`}
        target="_blank"
        title="Voir sur le site"
        className={button}
      >
        <Eye className="size-4" />
      </Link>

      <Link href={`/admin/produits/${id}`} title="Modifier" className={button}>
        <Pencil className="size-4" />
      </Link>

      <button
        type="button"
        title={isActive ? 'Désactiver' : 'Activer'}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await toggleProductActive(id, !isActive)
            toast.success(isActive ? 'Produit masqué' : 'Produit publié', {
              key: `produit-${id}`,
              description: isActive
                ? `« ${name} » n’apparaît plus sur le site.`
                : `« ${name} » est de nouveau visible sur le site.`,
              actions: isActive
                ? undefined
                : [{ label: 'Voir la fiche', href: `/produits/${slug}`, tone: 'neutral' }],
            })
            router.refresh()
          })
        }
        className={button}
      >
        {isActive ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>

      <button
        type="button"
        title="Dupliquer"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await duplicateProduct(id)
            if (result.ok && result.data) {
              toast.success('Produit dupliqué', {
                key: `produit-${id}`,
                description: `Une copie de « ${name} » a été créée : ajustez-la puis publiez-la.`,
              })
              router.push(`/admin/produits/${result.data.id}`)
            } else {
              toast.error('Duplication impossible', {
                key: `produit-${id}`,
                description: result.ok ? 'Réessayez dans un instant.' : result.error,
              })
              router.refresh()
            }
          })
        }
        className={button}
      >
        <Copy className="size-4" />
      </button>

      {confirming ? (
        <span className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteProduct(id)
                toast.success('Produit supprimé', {
                  key: `produit-${id}`,
                  description: `« ${name} » a été retiré du catalogue.`,
                })
                setConfirming(false)
                router.refresh()
              })
            }
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white"
          >
            Confirmer
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-lg border border-ink-200 px-3 py-2 text-xs font-semibold text-ink-600"
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          type="button"
          title="Supprimer"
          onClick={() => setConfirming(true)}
          className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 transition-colors hover:border-brand-400 hover:text-brand-600"
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </div>
  )
}
