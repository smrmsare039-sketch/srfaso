'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'
import { Save, Search, X } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { saveHomePromo } from '@/lib/actions/admin'
import { HOME_PROMO_PRODUCTS_MAX, type HomePromo } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

export type PromoProductOption = {
  id: string
  name: string
  price: number
  old_price: number | null
  image_url: string | null
}

/** `datetime-local` attend « AAAA-MM-JJTHH:MM » en heure locale. */
function toLocalInput(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function PromoForm({
  promo,
  products,
}: {
  promo: HomePromo | null
  products: PromoProductOption[]
}) {
  const [pending, startTransition] = useTransition()
  const [image, setImage] = useState(promo?.image_url ?? '')
  const [selected, setSelected] = useState<string[]>(promo?.product_ids ?? [])
  const [search, setSearch] = useState('')
  const toast = useToast()

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products])

  const results = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = term ? products.filter((p) => p.name.toLowerCase().includes(term)) : products
    return list.slice(0, 40)
  }, [products, search])

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length >= HOME_PROMO_PRODUCTS_MAX
          ? current
          : [...current, id]
    )
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await saveHomePromo(formData)
          if (result.ok) {
            toast.success('Section enregistrée', {
              key: 'promo',
              description: 'La page d’accueil est à jour.',
              actions: [{ label: 'Voir la page', href: '/', tone: 'neutral' }],
            })
          } else {
            toast.error('Enregistrement impossible', { key: 'promo', description: result.error })
          }
        })
      }}
      className="grid gap-5 xl:grid-cols-2"
    >
      <input type="hidden" name="image_url" value={image} />
      <input type="hidden" name="product_ids" value={selected.join(',')} />

      <div className="space-y-5">
        <Card title="Contenu de la bannière">
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-semibold text-ink-800">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={promo?.is_active ?? false}
                className="size-4 accent-brand-600"
              />
              Afficher la section sur la page d’accueil
            </label>

            <Field label="Sur-titre" hint="Court, au-dessus du titre. Exemple : « Offre du moment ».">
              <input
                name="eyebrow"
                defaultValue={promo?.eyebrow ?? ''}
                placeholder="Offre du moment"
                className={inputClass}
              />
            </Field>

            <Field label="Titre">
              <input
                name="title"
                defaultValue={promo?.title ?? ''}
                placeholder="Huile moteur moto SR 4T 20W-50 (1L)"
                className={inputClass}
              />
            </Field>

            <Field label="Description">
              <textarea
                name="description"
                rows={4}
                defaultValue={promo?.description ?? ''}
                className={textareaClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Texte du bouton">
                <input
                  name="cta_label"
                  defaultValue={promo?.cta_label ?? ''}
                  placeholder="Commander maintenant"
                  className={inputClass}
                />
              </Field>
              <Field label="Lien du bouton">
                <input
                  name="cta_href"
                  defaultValue={promo?.cta_href ?? ''}
                  placeholder="/produits/huile-moteur-20w-50-1l"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field
              label="Fin de l’offre"
              hint="Affiche un compte à rebours. Laissez vide pour ne pas en afficher."
            >
              <input
                type="datetime-local"
                name="ends_at"
                defaultValue={toLocalInput(promo?.ends_at ?? null)}
                className={inputClass}
              />
            </Field>

            <div>
              <p className="mb-1.5 text-sm font-semibold text-ink-800">Visuel</p>
              {image && (
                <div className="relative mb-3 aspect-[4/3] max-w-xs overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
                  <Image src={image} alt="" fill sizes="320px" className="object-cover" />
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <ImageUploader
                  folder="accueil"
                  baseName="promotion"
                  label={image ? 'Remplacer le visuel' : 'Ajouter un visuel'}
                  onUploaded={(url) => setImage(url)}
                />
                {image && (
                  <button
                    type="button"
                    onClick={() => setImage('')}
                    className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
                  >
                    Retirer
                  </button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card
          title="Produits mis en avant"
          description={`Affichés sous la bannière. ${selected.length}/${HOME_PROMO_PRODUCTS_MAX} sélectionné${selected.length > 1 ? 's' : ''}.`}
        >
          {selected.length > 0 && (
            <ul className="mb-4 space-y-2">
              {selected.map((id, index) => {
                const product = byId.get(id)
                return (
                  <li
                    key={id}
                    className="flex items-center gap-3 rounded-xl border border-ink-100 p-2"
                  >
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-ink-400">
                      {index + 1}
                    </span>
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {product?.image_url && (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
                      {product?.name ?? 'Produit supprimé'}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(id)}
                      aria-label="Retirer de la sélection"
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-ink-50 hover:text-brand-600"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit"
              className={`${inputClass} pl-9`}
            />
          </div>

          <ul className="scroll-thin mt-3 max-h-96 space-y-1 overflow-y-auto">
            {results.map((product) => {
              const active = selected.includes(product.id)
              const full = !active && selected.length >= HOME_PROMO_PRODUCTS_MAX
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    disabled={full}
                    onClick={() => toggle(product.id)}
                    className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors ${
                      active ? 'bg-brand-50' : 'hover:bg-ink-50'
                    } disabled:opacity-40`}
                  >
                    <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink-800">
                        {product.name}
                      </span>
                      <span className="block text-xs text-ink-400">
                        {formatPrice(product.price)}
                        {product.old_price ? ` · avant ${formatPrice(product.old_price)}` : ''}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-bold ${active ? 'text-brand-600' : 'text-ink-400'}`}
                    >
                      {active ? 'Retirer' : 'Ajouter'}
                    </span>
                  </button>
                </li>
              )
            })}
            {results.length === 0 && (
              <li className="py-6 text-center text-sm text-ink-400">Aucun produit trouvé.</li>
            )}
          </ul>
        </Card>

        <button
          type="submit"
          disabled={pending}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <Save className="size-4" />
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
