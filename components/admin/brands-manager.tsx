'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Pencil, Plus, Save, Star, Trash2, X } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Badge, Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { deletePartnerBrand, saveBrandsSection, savePartnerBrand } from '@/lib/actions/admin'
import type { PartnerBrand, SiteSettings } from '@/lib/types'
import { cx, slugify } from '@/lib/utils'

export function BrandsManager({
  brands,
  settings,
}: {
  brands: PartnerBrand[]
  settings: SiteSettings
}) {
  const router = useRouter()
  const [editing, setEditing] = useState<PartnerBrand | null>(null)
  const [creating, setCreating] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')
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
        <SectionForm settings={settings} />

        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setCreating(true)
            setLogoUrl('')
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white hover:bg-brand-700"
        >
          <Plus className="size-4" />
          Nouvelle marque
        </button>

        {brands.length === 0 ? (
          <Card>
            <p className="text-center text-sm text-ink-500">Aucune marque enregistrée.</p>
          </Card>
        ) : (
          brands.map((brand) => (
            <article
              key={brand.id}
              className={cx(
                'flex items-center gap-4 rounded-2xl border bg-white p-4',
                editing?.id === brand.id ? 'border-brand-300' : 'border-ink-200'
              )}
            >
              <span className="grid h-12 w-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-ink-100 bg-white">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={160}
                    height={80}
                    className="h-10 w-auto object-contain"
                  />
                ) : (
                  <span className="text-[10px] font-bold text-ink-400 uppercase">Sans logo</span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-ink-900">{brand.name}</h3>
                  {brand.is_primary && (
                    <Badge tone="brand">
                      <Star className="mr-1 inline size-3" />
                      Marque principale
                    </Badge>
                  )}
                  {!brand.is_active && <Badge tone="muted">Inactive</Badge>}
                  <span className="text-xs text-ink-400">position {brand.position}</span>
                </div>
                {brand.website_url && (
                  <p className="mt-1 truncate text-sm text-ink-500">{brand.website_url}</p>
                )}
              </div>

              <div className="flex shrink-0 flex-col gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false)
                    setEditing(brand)
                    setLogoUrl(brand.logo_url ?? '')
                  }}
                  title="Modifier"
                  className="grid size-9 place-items-center rounded-lg border border-ink-200 text-ink-500 hover:border-ink-400 hover:text-ink-900"
                >
                  <Pencil className="size-4" />
                </button>
                {confirmId === brand.id ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await deletePartnerBrand(brand.id)
                        toast.success('Marque supprimée', {
                          key: 'marque',
                          description: `« ${brand.name} » n’apparaît plus sur la page d’accueil.`,
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
                    onClick={() => setConfirmId(brand.id)}
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
        <BrandForm
          key={editing?.id ?? 'new'}
          brand={editing}
          logoUrl={logoUrl}
          setLogoUrl={setLogoUrl}
          pending={pending}
          onCancel={close}
          onSubmit={(formData) => {
            const isNew = editing === null
            startTransition(async () => {
              const result = await savePartnerBrand(formData)
              if (result.ok) {
                toast.success(isNew ? 'Marque ajoutée' : 'Marque modifiée', {
                  key: 'marque',
                  description: `« ${String(formData.get('name') ?? '')} » est à jour sur la page d’accueil.`,
                })
                close()
                router.refresh()
              } else {
                toast.error(isNew ? 'Ajout impossible' : 'Enregistrement impossible', {
                  key: 'marque',
                  description: result.error,
                })
              }
            })
          }}
        />
      ) : (
        <Card title="Marques partenaires">
          <p className="text-sm leading-relaxed text-ink-500">
            Les marques actives s’affichent sur la page d’accueil, dans l’ordre de la valeur
            « Position ». Déposez un logo à fond transparent (PNG ou SVG, hauteur ~160 px) ; sans
            logo, le nom de la marque s’affiche à la place.
          </p>
        </Card>
      )}
    </div>
  )
}

function SectionForm({ settings }: { settings: SiteSettings }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await saveBrandsSection(formData)
          if (result.ok) {
            toast.success('Texte enregistré', {
              key: 'marques-section',
              description: 'La section « Marques » de la page d’accueil est à jour.',
              actions: [{ label: 'Voir l’accueil', href: '/', tone: 'neutral' }],
            })
            router.refresh()
          } else {
            toast.error('Enregistrement impossible', {
              key: 'marques-section',
              description: result.error,
            })
          }
        })
      }}
    >
      <Card title="Texte de la section">
        <div className="space-y-4">
          <Field label="Titre de la section">
            <input
              name="home_brands_title"
              defaultValue={settings.home_brands_title ?? ''}
              className={inputClass}
            />
          </Field>

          <Field label="Texte d’introduction">
            <textarea
              name="home_brands_intro"
              rows={5}
              defaultValue={settings.home_brands_intro ?? ''}
              className={textareaClass}
            />
          </Field>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-5 text-sm font-bold text-white hover:bg-ink-800 disabled:opacity-60"
            >
              <Save className="size-4" />
              {pending ? 'Enregistrement…' : 'Enregistrer le texte'}
            </button>
          </div>
        </div>
      </Card>
    </form>
  )
}

function BrandForm({
  brand,
  logoUrl,
  setLogoUrl,
  pending,
  onCancel,
  onSubmit,
}: {
  brand: PartnerBrand | null
  logoUrl: string
  setLogoUrl: (url: string) => void
  pending: boolean
  onCancel: () => void
  onSubmit: (formData: FormData) => void
}) {
  const [name, setName] = useState(brand?.name ?? '')
  const [slug, setSlug] = useState(brand?.slug ?? '')

  return (
    <form action={onSubmit} className="xl:sticky xl:top-24 xl:self-start">
      <div className="rounded-2xl border border-ink-200 bg-white">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="font-bold text-ink-900">
            {brand ? 'Modifier la marque' : 'Nouvelle marque'}
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
          {brand && <input type="hidden" name="id" value={brand.id} />}
          <input type="hidden" name="logo_url" value={logoUrl} />

          <Field label="Nom *">
            <input
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!brand) setSlug(slugify(e.target.value))
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

          <Field
            label="Site officiel"
            hint="Facultatif. Le logo devient alors un lien ouvert dans un nouvel onglet."
          >
            <input
              name="website_url"
              type="url"
              placeholder="https://"
              defaultValue={brand?.website_url ?? ''}
              className={inputClass}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-semibold text-ink-800">Logo</p>
            {logoUrl && (
              <div className="mb-3 flex flex-col items-center gap-2 rounded-xl border border-ink-100 bg-white p-3">
                <Image
                  src={logoUrl}
                  alt=""
                  width={240}
                  height={120}
                  className="h-16 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => setLogoUrl('')}
                  className="rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs font-semibold text-ink-700"
                >
                  Retirer
                </button>
              </div>
            )}
            <ImageUploader
              folder="brands"
              baseName={name || 'marque'}
              label={logoUrl ? 'Remplacer le logo' : 'Ajouter un logo'}
              onUploaded={(url) => setLogoUrl(url)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Position">
              <input
                name="position"
                type="number"
                step="10"
                defaultValue={brand?.position ?? 0}
                className={inputClass}
              />
            </Field>
            <div className="space-y-2 pt-7">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={brand?.is_active ?? true}
                  className="size-4 rounded border-ink-300 accent-brand-600"
                />
                Marque affichée
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name="is_primary"
                  defaultChecked={brand?.is_primary ?? false}
                  className="size-4 rounded border-ink-300 accent-brand-600"
                />
                Marque principale
              </label>
            </div>
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
