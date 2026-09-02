'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { ArrowLeft, ArrowRight, EyeOff, Pencil, Save, Trash2 } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { ConfirmModal, Modal } from '@/components/admin/modal'
import { Badge, Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import {
  addWorkshopPhotos,
  deleteWorkshopPhoto,
  moveWorkshopPhoto,
  saveWorkshopPhoto,
} from '@/lib/actions/admin'
import type { Service, WorkshopPhotoWithService } from '@/lib/types'
import { cx } from '@/lib/utils'

export function WorkshopGalleryManager({
  photos,
  services,
}: {
  photos: WorkshopPhotoWithService[]
  services: Service[]
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<WorkshopPhotoWithService | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  // Les URL arrivent une par une du téléversement : on les regroupe avant d'écrire.
  const batch = useRef<string[]>([])
  const flush = useRef<ReturnType<typeof setTimeout> | null>(null)

  const confirmTarget = photos.find((p) => p.id === confirmId) ?? null

  function queue(url: string) {
    batch.current.push(url)
    if (flush.current) clearTimeout(flush.current)
    flush.current = setTimeout(() => {
      const urls = batch.current
      batch.current = []
      startTransition(async () => {
        const result = await addWorkshopPhotos(urls)
        if (result.ok) {
          toast.success(`${urls.length} photo${urls.length > 1 ? 's' : ''} ajoutée${urls.length > 1 ? 's' : ''}`, {
            key: 'galerie-atelier',
            image: urls[0],
            description: 'Ajoutez une légende et la prestation associée pour convaincre davantage.',
          })
          router.refresh()
        } else {
          toast.error('Ajout impossible', { key: 'galerie-atelier', description: result.error })
        }
      })
    }, 400)
  }

  return (
    <Card
      title="Galerie de l’atelier"
      description="Photos affichées sur /mecanique, avant la liste des prestations. La première photo occupe la grande case de la mosaïque."
    >
      <ImageUploader
        folder="atelier"
        baseName="atelier"
        multiple
        label="Ajouter des photos"
        onUploaded={(url) => queue(url)}
      />

      {photos.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-ink-200 py-10 text-center text-sm text-ink-500">
          Aucune photo pour le moment. Des visuels réels de l’atelier (avant / après, moteur ouvert,
          pièce remplacée) rassurent bien plus qu’un texte.
        </p>
      ) : (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => (
            <li
              key={photo.id}
              className={cx(
                'group relative overflow-hidden rounded-xl border bg-ink-50',
                photo.is_active ? 'border-ink-200' : 'border-dashed border-ink-300'
              )}
            >
              <span className="relative block aspect-square">
                <Image
                  src={photo.image_url}
                  alt={photo.title ?? ''}
                  fill
                  sizes="200px"
                  className={cx('object-cover', !photo.is_active && 'opacity-50')}
                />
              </span>

              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-1 p-2">
                <span className="flex flex-wrap gap-1">
                  {index === 0 && <Badge tone="brand">Mise en avant</Badge>}
                  {photo.before_url && <Badge tone="info">Avant / Après</Badge>}
                  {!photo.is_active && (
                    <Badge tone="muted">
                      <EyeOff className="mr-1 inline size-3" />
                      Masquée
                    </Badge>
                  )}
                </span>
              </div>

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-2.5">
                <p className="truncate text-xs font-bold text-white">
                  {photo.title ?? 'Sans titre'}
                </p>
                {photo.service && (
                  <p className="truncate text-[0.6875rem] text-white/70">{photo.service.title}</p>
                )}

                <div className="mt-2 flex gap-1">
                  <IconButton
                    label="Déplacer avant"
                    disabled={pending || index === 0}
                    onClick={() =>
                      startTransition(async () => {
                        await moveWorkshopPhoto(photo.id, -1)
                        router.refresh()
                      })
                    }
                  >
                    <ArrowLeft className="size-3.5" />
                  </IconButton>
                  <IconButton
                    label="Déplacer après"
                    disabled={pending || index === photos.length - 1}
                    onClick={() =>
                      startTransition(async () => {
                        await moveWorkshopPhoto(photo.id, 1)
                        router.refresh()
                      })
                    }
                  >
                    <ArrowRight className="size-3.5" />
                  </IconButton>
                  <IconButton label="Modifier" onClick={() => setEditing(photo)}>
                    <Pencil className="size-3.5" />
                  </IconButton>
                  <IconButton label="Supprimer" onClick={() => setConfirmId(photo.id)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={editing !== null}
        size="lg"
        title="Modifier la photo"
        description="Une légende concrète (panne, pièce, durée) convertit mieux qu’un titre générique."
        onClose={() => setEditing(null)}
      >
        {editing && (
          <PhotoForm
            key={editing.id}
            photo={editing}
            services={services}
            pending={pending}
            onCancel={() => setEditing(null)}
            onSubmit={(formData) => {
              startTransition(async () => {
                const result = await saveWorkshopPhoto(formData)
                if (result.ok) {
                  toast.success('Photo enregistrée', {
                    key: 'galerie-atelier',
                    description: 'La galerie de /mecanique est à jour.',
                  })
                  setEditing(null)
                  router.refresh()
                } else {
                  toast.error('Enregistrement impossible', {
                    key: 'galerie-atelier',
                    description: result.error,
                  })
                }
              })
            }}
          />
        )}
      </Modal>

      <ConfirmModal
        open={confirmTarget !== null}
        pending={pending}
        title="Supprimer cette photo ?"
        description="Elle disparaîtra de la galerie de la page Mécanique."
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          const target = confirmTarget
          if (!target) return
          startTransition(async () => {
            const result = await deleteWorkshopPhoto(target.id)
            if (result.ok) {
              toast.success('Photo supprimée', { key: 'galerie-atelier' })
              setConfirmId(null)
              router.refresh()
            } else {
              toast.error('Suppression impossible', {
                key: 'galerie-atelier',
                description: result.error,
              })
            }
          })
        }}
      />
    </Card>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md bg-white/90 text-ink-800 transition-colors hover:bg-white disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function PhotoForm({
  photo,
  services,
  pending,
  onCancel,
  onSubmit,
}: {
  photo: WorkshopPhotoWithService
  services: Service[]
  pending: boolean
  onCancel: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [imageUrl, setImageUrl] = useState(photo.image_url)
  const [beforeUrl, setBeforeUrl] = useState(photo.before_url ?? '')

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="id" value={photo.id} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <input type="hidden" name="before_url" value={beforeUrl} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-800">Photo (après)</p>
          <span className="relative block aspect-square overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
            <Image src={imageUrl} alt="" fill sizes="240px" className="object-cover" />
          </span>
          <div className="mt-2">
            <ImageUploader
              folder="atelier"
              baseName="atelier"
              label="Remplacer"
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-semibold text-ink-800">
            Photo « avant » <span className="font-normal text-ink-400">(facultatif)</span>
          </p>
          <span className="relative block aspect-square overflow-hidden rounded-xl border border-dashed border-ink-200 bg-ink-50">
            {beforeUrl ? (
              <Image src={beforeUrl} alt="" fill sizes="240px" className="object-cover" />
            ) : (
              <span className="grid size-full place-items-center px-3 text-center text-xs text-ink-400">
                Ajoutez l’état avant intervention pour un comparatif avant / après.
              </span>
            )}
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            <ImageUploader
              folder="atelier"
              baseName="atelier-avant"
              label={beforeUrl ? 'Remplacer' : 'Ajouter'}
              onUploaded={(url) => setBeforeUrl(url)}
            />
            {beforeUrl && (
              <button
                type="button"
                onClick={() => setBeforeUrl('')}
                className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
              >
                Retirer
              </button>
            )}
          </div>
        </div>
      </div>

      <Field label="Titre" hint="Ex. « Réfection moteur 135 » — affiché sur la photo.">
        <input name="title" defaultValue={photo.title ?? ''} className={inputClass} />
      </Field>

      <Field
        label="Légende"
        hint="Le cas traité en une phrase : symptôme, pièce remplacée, durée d’immobilisation."
      >
        <textarea
          name="caption"
          rows={3}
          defaultValue={photo.caption ?? ''}
          className={textareaClass}
        />
      </Field>

      <Field label="Prestation associée" hint="Sert de filtre et pré-remplit le message WhatsApp.">
        <select name="service_id" defaultValue={photo.service_id ?? ''} className={inputClass}>
          <option value="">— Aucune —</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Position">
          <input
            name="position"
            type="number"
            step="10"
            defaultValue={photo.position}
            className={inputClass}
          />
        </Field>
        <label className="flex cursor-pointer items-center gap-2.5 pt-7 text-sm text-ink-700">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={photo.is_active}
            className="size-4 rounded border-ink-300 accent-brand-600"
          />
          Photo visible sur le site
        </label>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="h-12 rounded-xl border border-ink-200 px-5 text-sm font-semibold text-ink-700 hover:border-ink-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={pending}
          className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="size-4" />
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
