'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil, Plus, Save, Trash2 } from 'lucide-react'
import { CategoryIcon, ICON_NAMES } from '@/components/category-icon'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Badge, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { ConfirmModal, Modal } from '@/components/admin/modal'
import { useToast } from '@/components/toast'
import { deleteCategory, saveCategory } from '@/lib/actions/admin'
import type { Category } from '@/lib/types'
import { cx, slugify } from '@/lib/utils'

export function CategoriesManager({
  categories,
  counts,
}: {
  categories: Category[]
  counts: Record<string, number>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [pending, startTransition] = useTransition()
  const [imageUrl, setImageUrl] = useState<string>('')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const toast = useToast()

  const open = creating || editing !== null
  const current = editing
  const confirmTarget = categories.find((c) => c.id === confirmId) ?? null

  function startCreate() {
    setEditing(null)
    setCreating(true)
    setImageUrl('')
  }

  function startEdit(category: Category) {
    setCreating(false)
    setEditing(category)
    setImageUrl(category.image_url ?? '')
  }

  function close() {
    setCreating(false)
    setEditing(null)
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 px-5 py-4">
          <div>
            <h3 className="font-bold text-ink-900">
              {categories.length} catégorie{categories.length > 1 ? 's' : ''}
            </h3>
            <p className="mt-0.5 text-sm text-ink-500">
              L’ordre d’affichage sur le site suit la valeur « Position », du plus petit au plus
              grand.
            </p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Plus className="size-4" />
            Nouvelle
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-500">
            Aucune catégorie pour le moment.
          </p>
        ) : (
          <ul>
            {categories.map((category) => (
              <li
                key={category.id}
                className={cx(
                  'flex items-center gap-3 border-b border-ink-50 px-5 py-3 last:border-0',
                  editing?.id === category.id && 'bg-brand-50/50'
                )}
              >
                <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-ink-50 text-ink-700">
                  {category.image_url ? (
                    <Image
                      src={category.image_url}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    <CategoryIcon name={category.icon} className="size-5" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-ink-900">
                    {category.name}
                  </span>
                  <span className="block truncate text-xs text-ink-400">/{category.slug}</span>
                </span>

                <span className="hidden text-xs text-ink-400 sm:block">
                  {counts[category.id] ?? 0} produit{(counts[category.id] ?? 0) > 1 ? 's' : ''}
                </span>

                {!category.is_active && <Badge tone="muted">Inactive</Badge>}

                <span className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => startEdit(category)}
                    title="Modifier"
                    className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmId(category.id)}
                    title="Supprimer"
                    className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-brand-400 hover:text-brand-600"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={open}
        size="lg"
        title={current ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
        description={
          current ? `« ${current.name} » — visible immédiatement sur le site.` : undefined
        }
        onClose={close}
      >
        <CategoryForm
          key={current?.id ?? 'new'}
          category={current}
          categories={categories}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          pending={pending}
          onCancel={close}
          onSubmit={(formData) => {
            const isNew = current === null
            startTransition(async () => {
              const result = await saveCategory(formData)
              if (result.ok) {
                toast.success(isNew ? 'Catégorie créée' : 'Catégorie modifiée', {
                  key: 'categorie',
                  description: `« ${String(formData.get('name') ?? '')} » est à jour sur le site.`,
                })
                close()
                router.refresh()
              } else {
                toast.error(
                  isNew ? 'Création impossible' : 'Enregistrement impossible',
                  { key: 'categorie', description: result.error }
                )
              }
            })
          }}
        />
      </Modal>

      <ConfirmModal
        open={confirmTarget !== null}
        pending={pending}
        title="Supprimer cette catégorie ?"
        description={`« ${confirmTarget?.name ?? ''} » sera retirée du site. Les produits rattachés ne sont pas supprimés, mais perdent cette catégorie.`}
        onClose={() => setConfirmId(null)}
        onConfirm={() => {
          const target = confirmTarget
          if (!target) return
          startTransition(async () => {
            const result = await deleteCategory(target.id)
            if (result.ok) {
              toast.success('Catégorie supprimée', {
                key: 'categorie',
                description: `« ${target.name} » n’apparaît plus sur le site.`,
              })
            } else {
              toast.error('Suppression impossible', {
                key: 'categorie',
                description: result.error,
              })
            }
            setConfirmId(null)
            router.refresh()
          })
        }}
      />
    </div>
  )
}

function CategoryForm({
  category,
  categories,
  imageUrl,
  setImageUrl,
  pending,
  onCancel,
  onSubmit,
}: {
  category: Category | null
  categories: Category[]
  imageUrl: string
  setImageUrl: (url: string) => void
  pending: boolean
  onCancel: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [slug, setSlug] = useState(category?.slug ?? '')

  return (
    <form action={onSubmit}>
      <div className="space-y-4 p-4 sm:p-5">
          {category && <input type="hidden" name="id" value={category.id} />}
          <input type="hidden" name="image_url" value={imageUrl} />

          <Field label="Nom *">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!category) setSlug(slugify(e.target.value))
              }}
              className={inputClass}
            />
          </Field>

          <Field label="Slug (URL)">
            <input
              name="slug"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Catégorie parente">
              <select
                name="parent_id"
                defaultValue={category?.parent_id ?? ''}
                className={inputClass}
              >
                <option value="">— Aucune —</option>
                {categories
                  .filter((c) => c.id !== category?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Position">
              <input
                name="position"
                type="number"
                step="10"
                defaultValue={category?.position ?? 0}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Icône" hint="Affichée dans le menu latéral des catégories.">
            <select name="icon" defaultValue={category?.icon ?? ''} className={inputClass}>
              <option value="">— Par défaut —</option>
              {ICON_NAMES.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Description">
            <textarea
              name="description"
              rows={3}
              defaultValue={category?.description ?? ''}
              className={textareaClass}
            />
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
              folder="categories"
              baseName={name || 'categorie'}
              label={imageUrl ? 'Remplacer l’image' : 'Ajouter une image'}
              onUploaded={(url) => setImageUrl(url)}
            />
          </div>

          <Field label="Texte alternatif de l’image">
            <input
              name="image_alt"
              defaultValue={category?.image_alt ?? ''}
              placeholder="Batteries moto SR Faso"
              className={inputClass}
            />
          </Field>

          <Field label="Titre SEO">
            <input name="seo_title" defaultValue={category?.seo_title ?? ''} className={inputClass} />
          </Field>

          <Field label="Meta description SEO">
            <textarea
              name="seo_description"
              rows={3}
              defaultValue={category?.seo_description ?? ''}
              className={textareaClass}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={category?.is_active ?? true}
              className="size-4 rounded border-ink-300 accent-brand-600"
            />
            Catégorie active
          </label>

        <div className="pb-safe sticky bottom-0 -mx-4 -mb-4 flex flex-col-reverse gap-2 border-t border-ink-100 bg-white px-4 py-3 sm:-mx-5 sm:-mb-5 sm:flex-row sm:justify-end sm:px-5 sm:py-4 sm:pb-4">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 rounded-xl border border-ink-200 px-5 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-900 sm:h-11"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 sm:h-11"
          >
            <Save className="size-4" />
            {pending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </form>
  )
}
