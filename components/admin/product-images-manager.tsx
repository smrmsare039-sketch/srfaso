'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2 } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Card } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import {
  addProductImage,
  deleteProductImage,
  moveProductImage,
  setPrimaryImage,
} from '@/lib/actions/admin'
import type { ProductImage } from '@/lib/types'
import { cx } from '@/lib/utils'

export function ProductImagesManager({
  productId,
  productName,
  images,
}: {
  productId: string
  productName: string
  images: ProductImage[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const iconButton =
    'grid size-8 place-items-center rounded-lg bg-white/95 text-ink-700 shadow-sm transition-colors hover:text-brand-600 disabled:opacity-50'

  return (
    <Card
      title="Images"
      description="La première image (« Principale ») est utilisée sur les listes et le partage."
    >
      {images.length > 0 && (
        <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, index) => (
            <li
              key={img.id}
              className={cx(
                'group relative aspect-square overflow-hidden rounded-xl border-2 bg-ink-50',
                img.is_primary ? 'border-brand-500' : 'border-ink-100'
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? productName}
                fill
                sizes="200px"
                className="object-cover"
              />

              {img.is_primary && (
                <span className="absolute top-2 left-2 rounded-full bg-brand-600 px-2 py-0.5 text-[0.6875rem] font-bold text-white">
                  Principale
                </span>
              )}

              <div className="absolute inset-x-2 bottom-2 flex justify-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  title="Définir comme image principale"
                  disabled={pending || img.is_primary}
                  onClick={() =>
                    startTransition(async () => {
                      await setPrimaryImage(img.id, productId)
                      toast.success('Image principale définie', {
                        key: 'images-produit',
                        image: img.url,
                        description: 'Elle est utilisée dans les listes et les partages.',
                      })
                      router.refresh()
                    })
                  }
                  className={iconButton}
                >
                  <Star className="size-4" />
                </button>
                <button
                  type="button"
                  title="Déplacer à gauche"
                  disabled={pending || index === 0}
                  onClick={() =>
                    startTransition(async () => {
                      await moveProductImage(img.id, productId, -1)
                      router.refresh()
                    })
                  }
                  className={iconButton}
                >
                  <ArrowLeft className="size-4" />
                </button>
                <button
                  type="button"
                  title="Déplacer à droite"
                  disabled={pending || index === images.length - 1}
                  onClick={() =>
                    startTransition(async () => {
                      await moveProductImage(img.id, productId, 1)
                      router.refresh()
                    })
                  }
                  className={iconButton}
                >
                  <ArrowRight className="size-4" />
                </button>
                <button
                  type="button"
                  title="Supprimer l’image"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteProductImage(img.id)
                      toast.success('Image supprimée', {
                        key: 'images-produit',
                        description: 'Elle n’apparaît plus sur la fiche produit.',
                      })
                      router.refresh()
                    })
                  }
                  className={cx(iconButton, 'hover:text-brand-600')}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-center gap-3">
        <ImageUploader
          folder={`produits/${productId}`}
          baseName={productName}
          multiple
          label={images.length === 0 ? 'Ajouter des images' : 'Ajouter d’autres images'}
          onUploaded={async (url, fileName) => {
            await addProductImage(productId, url, `${productName} — ${fileName}`)
            router.refresh()
          }}
        />
        {pending && <Loader2 className="size-4 animate-spin text-ink-400" />}
      </div>

      <p className="mt-3 text-xs text-ink-400">
        Formats acceptés : JPG, PNG, WebP — 5 Mo maximum. Le texte alternatif est généré à partir
        du nom du produit et du fichier.
      </p>
    </Card>
  )
}
