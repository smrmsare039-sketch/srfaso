'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { MapPin, Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Badge, Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { deleteShop, saveShop } from '@/lib/actions/admin'
import type { Shop } from '@/lib/types'
import { cx, slugify } from '@/lib/utils'

export function ShopsManager({ shops }: { shops: Shop[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Shop | null>(null)
  const [creating, setCreating] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  const open = creating || editing !== null

  function close() {
    setCreating(false)
    setEditing(null)
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_1fr]">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreating(true)
            setImageUrl('')
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700"
        >
          <Plus className="size-4" />
          Nouvelle boutique
        </button>

        {shops.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-ink-500">Aucune boutique enregistrée.</p>
          </Card>
        ) : (
          shops.map((shop) => (
            <article
              key={shop.id}
              className={cx(
                'flex gap-4 rounded-2xl border bg-white p-4',
                editing?.id === shop.id ? 'border-brand-300' : 'border-ink-200'
              )}
            >
              <span className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                {shop.image_url ? (
                  <Image src={shop.image_url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-ink-300">
                    <MapPin className="size-6" />
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{shop.name}</h3>
                  {!shop.is_active && <Badge tone="muted">Inactive</Badge>}
                </div>
                <p className="mt-1 text-sm text-ink-500">{shop.address}</p>
                <p className="text-sm text-ink-400">
                  {shop.phone}
                  {shop.hours ? ` · ${shop.hours}` : ''}
                </p>
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setEditing(shop)
                    setImageUrl(shop.image_url ?? '')
                  }}
                  title="Modifier"
                  className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900"
                >
                  <Pencil className="size-4" />
                </button>
                {confirmId === shop.id ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await deleteShop(shop.id)
                        if (result.ok) {
                          toast.success('Boutique supprimée', {
                            key: 'boutique',
                            description: `« ${shop.name} » n’apparaît plus sur le site.`,
                          })
                        } else {
                          toast.error('Suppression impossible', {
                            key: 'boutique',
                            description: result.error,
                          })
                        }
                        setConfirmId(null)
                        router.refresh()
                      })
                    }
                    className="rounded-lg bg-brand-600 px-2 py-1.5 text-[0.6875rem] font-bold text-white"
                  >
                    Confirmer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(shop.id)}
                    title="Supprimer"
                    className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {open ? (
        <ShopForm
          key={editing?.id ?? 'new'}
          shop={editing}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          pending={pending}
          onCancel={close}
          onSubmit={(formData) => {
            const isNew = editing === null
            startTransition(async () => {
              const result = await saveShop(formData)
              if (result.ok) {
                toast.success(isNew ? 'Boutique créée' : 'Boutique modifiée', {
                  key: 'boutique',
                  description: `« ${String(formData.get('name') ?? '')} » est à jour sur le site.`,
                })
                close()
                router.refresh()
              } else {
                toast.error(isNew ? 'Création impossible' : 'Enregistrement impossible', {
                  key: 'boutique',
                  description: result.error,
                })
              }
            })
          }}
        />
      ) : (
        <Card title="Gestion des boutiques">
          <p className="text-sm leading-relaxed text-ink-500">
            Renseignez l’adresse, les horaires et les coordonnées GPS de chaque point de vente. Les
            coordonnées alimentent le bouton « Itinéraire » et les données structurées
            LocalBusiness.
          </p>
        </Card>
      )}
    </div>
  )
}

function ShopForm({
  shop,
  imageUrl,
  setImageUrl,
  pending,
  onCancel,
  onSubmit,
}: {
  shop: Shop | null
  imageUrl: string
  setImageUrl: (url: string) => void
  pending: boolean
  onCancel: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [name, setName] = useState(shop?.name ?? '')
  const [slug, setSlug] = useState(shop?.slug ?? '')
  const [videoUrl, setVideoUrl] = useState(shop?.video_url ?? '')

  return (
    <form action={onSubmit} className="xl:sticky xl:top-24 xl:self-start">
      <div className="rounded-2xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="font-bold text-ink-900">
            {shop ? 'Modifier la boutique' : 'Nouvelle boutique'}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-lg text-ink-400 hover:bg-ink-50"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          {shop && <input type="hidden" name="id" value={shop.id} />}
          <input type="hidden" name="image_url" value={imageUrl} />
          <input type="hidden" name="video_url" value={videoUrl} />

          <Field label="Nom *">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!shop) setSlug(slugify(e.target.value))
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Slug (URL)">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={2}
              defaultValue={shop?.description ?? ''}
              className={textareaClass}
            />
          </Field>

          <Field label="Adresse">
            <input name="address" defaultValue={shop?.address ?? ''} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ville">
              <input
                name="city"
                defaultValue={shop?.city ?? 'Ouagadougou'}
                className={inputClass}
              />
            </Field>
            <Field label="Quartier">
              <input name="district" defaultValue={shop?.district ?? ''} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Téléphone">
              <input name="phone" defaultValue={shop?.phone ?? ''} className={inputClass} />
            </Field>
            <Field label="WhatsApp">
              <input name="whatsapp" defaultValue={shop?.whatsapp ?? ''} className={inputClass} />
            </Field>
          </div>

          <Field label="Horaires">
            <input
              name="hours"
              defaultValue={shop?.hours ?? ''}
              placeholder="Lundi – Samedi : 07h30 – 19h00"
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Latitude">
              <input
                name="latitude"
                type="number"
                step="any"
                defaultValue={shop?.latitude ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="Longitude">
              <input
                name="longitude"
                type="number"
                step="any"
                defaultValue={shop?.longitude ?? ''}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Lien Google Maps" hint="Prioritaire sur les coordonnées GPS.">
            <input name="map_url" defaultValue={shop?.map_url ?? ''} className={inputClass} />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Photo de la boutique</p>
            {imageUrl && (
              <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-xl border border-ink-100">
                <Image src={imageUrl} alt="" fill sizes="320px" className="object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-ink-700"
                >
                  Retirer
                </button>
              </div>
            )}
            <ImageUploader
              folder="boutiques"
              baseName={name || 'boutique'}
              label={imageUrl ? 'Remplacer la photo' : 'Ajouter une photo'}
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Vidéo de fond</p>
            <p className="mb-2 text-xs text-ink-400">
              Utilisée en arrière-plan de la carte sur la page Boutiques. MP4 ou WebM, 25 Mo
              maximum, sans son. La photo ci-dessus sert d’image d’attente.
            </p>
            {videoUrl && (
              <div className="mb-3 overflow-hidden rounded-xl border border-ink-100">
                <video
                  src={videoUrl}
                  muted
                  loop
                  playsInline
                  controls
                  className="aspect-[16/9] w-full bg-ink-900 object-cover"
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <ImageUploader
                folder="boutiques"
                baseName={`${name || 'boutique'}-video`}
                kind="video"
                label={videoUrl ? 'Remplacer la vidéo' : 'Ajouter une vidéo'}
                onUploaded={(url) => setVideoUrl(url)}
              />
              {videoUrl && (
                <button
                  type="button"
                  onClick={() => setVideoUrl('')}
                  className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
                >
                  Retirer
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Position">
              <input
                name="position"
                type="number"
                step="10"
                defaultValue={shop?.position ?? 0}
                className={inputClass}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 pt-7 text-sm text-ink-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={shop?.is_active ?? true}
                className="size-4 rounded border-ink-300 accent-brand-600"
              />
              Boutique active
            </label>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="size-4" />
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  )
}
