'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react'
import { CategoryIcon, ICON_NAMES } from '@/components/category-icon'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Badge, Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { deleteService, saveService } from '@/lib/actions/admin'
import type { Service } from '@/lib/types'
import { cx, slugify } from '@/lib/utils'

export function ServicesManager({ services }: { services: Service[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Service | null>(null)
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
          Nouvelle prestation
        </button>

        {services.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-ink-500">Aucune prestation enregistrée.</p>
          </Card>
        ) : (
          services.map((service) => (
            <article
              key={service.id}
              className={cx(
                'flex items-center gap-4 rounded-2xl border bg-white p-4',
                editing?.id === service.id ? 'border-brand-300' : 'border-ink-200'
              )}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <CategoryIcon name={service.icon} className="size-5" />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{service.title}</h3>
                  {!service.is_active && <Badge tone="muted">Inactive</Badge>}
                  <span className="text-xs text-ink-400">position {service.position}</span>
                </div>
                {service.description && (
                  <p className="mt-1 truncate text-sm text-ink-500">{service.description}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setEditing(service)
                    setImageUrl(service.image_url ?? '')
                  }}
                  title="Modifier"
                  className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900"
                >
                  <Pencil className="size-4" />
                </button>
                {confirmId === service.id ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deleteService(service.id)
                        toast.success('Prestation supprimée', {
                          key: 'prestation',
                          description: `« ${service.title} » n’apparaît plus sur le site.`,
                        })
                        setConfirmId(null)
                        router.refresh()
                      })
                    }
                    className="rounded-lg bg-brand-600 px-2 py-1.5 text-[11px] font-bold text-white"
                  >
                    Confirmer
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(service.id)}
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
        <ServiceForm
          key={editing?.id ?? 'new'}
          service={editing}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          pending={pending}
          onCancel={close}
          onSubmit={(formData) => {
            const isNew = editing === null
            startTransition(async () => {
              const result = await saveService(formData)
              if (result.ok) {
                toast.success(isNew ? 'Prestation créée' : 'Prestation modifiée', {
                  key: 'prestation',
                  description: `« ${String(formData.get('title') ?? '')} » est à jour sur le site.`,
                })
                close()
                router.refresh()
              } else {
                toast.error(isNew ? 'Création impossible' : 'Enregistrement impossible', {
                  key: 'prestation',
                  description: result.error,
                })
              }
            })
          }}
        />
      ) : (
        <Card title="Gestion de la mécanique">
          <p className="text-sm leading-relaxed text-ink-500">
            Décrivez les prestations réellement proposées par l’atelier. L’ordre d’affichage sur la
            page /mecanique suit la valeur « Position ».
          </p>
        </Card>
      )}
    </div>
  )
}

function ServiceForm({
  service,
  imageUrl,
  setImageUrl,
  pending,
  onCancel,
  onSubmit,
}: {
  service: Service | null
  imageUrl: string
  setImageUrl: (url: string) => void
  pending: boolean
  onCancel: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [title, setTitle] = useState(service?.title ?? '')
  const [slug, setSlug] = useState(service?.slug ?? '')

  return (
    <form action={onSubmit} className="xl:sticky xl:top-24 xl:self-start">
      <div className="rounded-2xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="font-bold text-ink-900">
            {service ? 'Modifier la prestation' : 'Nouvelle prestation'}
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
          {service && <input type="hidden" name="id" value={service.id} />}
          <input type="hidden" name="image_url" value={imageUrl} />

          <Field label="Titre *">
            <input
              name="title"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                if (!service) setSlug(slugify(e.target.value))
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Slug">
            <input
              name="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
            />
          </Field>

          <Field label="Description courte">
            <textarea
              name="description"
              rows={2}
              defaultValue={service?.description ?? ''}
              className={textareaClass}
            />
          </Field>

          <Field label="Détails">
            <textarea
              name="details"
              rows={5}
              defaultValue={service?.details ?? ''}
              className={textareaClass}
            />
          </Field>

          <Field label="Tarif affiché" hint="Ex. « À partir de 5 000 FCFA ». Laisser vide si non communiqué.">
            <input
              name="price_label"
              defaultValue={service?.price_label ?? ''}
              className={inputClass}
            />
          </Field>

          <Field label="Icône">
            <select name="icon" defaultValue={service?.icon ?? ''} className={inputClass}>
              <option value="">— Par défaut —</option>
              {ICON_NAMES.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Image</p>
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
              folder="services"
              baseName={title || 'service'}
              label={imageUrl ? 'Remplacer l’image' : 'Ajouter une image'}
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Position">
              <input
                name="position"
                type="number"
                step="10"
                defaultValue={service?.position ?? 0}
                className={inputClass}
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 pt-7 text-sm text-ink-700">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={service?.is_active ?? true}
                className="size-4 rounded border-ink-300 accent-brand-600"
              />
              Prestation active
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
