'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { ProductAiPanel } from '@/components/admin/product-ai-panel'
import { Card, Field, inputClass, labelClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { saveProduct } from '@/lib/actions/admin'
import type { ProductSuggestion } from '@/lib/actions/ai'
import type { Category, ProductWithRelations } from '@/lib/types'
import { slugify } from '@/lib/utils'

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductWithRelations
  categories: Category[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [name, setName] = useState(product?.name ?? '')
  const [slug, setSlug] = useState(product?.slug ?? '')

  const [aiImage, setAiImage] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const toast = useToast()

  const specsText = (product?.specifications ?? [])
    .map((s) => `${s.label} : ${s.value}`)
    .join('\n')

  const checkbox = 'size-4 rounded border-ink-300 accent-brand-600'

  /**
   * Reporte la proposition de l'IA dans le formulaire. Les champs sont
   * non contrôlés : on écrit directement dans les éléments, sauf le nom et
   * le slug qui ont leur propre état.
   */
  function applySuggestion(suggestion: ProductSuggestion) {
    const form = formRef.current
    if (!form) return

    const set = (fieldName: string, value: string) => {
      if (!value) return
      const el = form.elements.namedItem(fieldName)
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = value
      else if (el instanceof HTMLSelectElement) {
        const option = [...el.options].find(
          (o) => o.text.trim().toLowerCase() === value.trim().toLowerCase()
        )
        if (option) el.value = option.value
      }
    }

    setName(suggestion.name)
    if (!product) setSlug(slugify(suggestion.name))

    set('brand', suggestion.brand ?? '')
    set('reference', suggestion.reference ?? '')
    set('category_id', suggestion.category ?? '')
    set('short_description', suggestion.short_description)
    set('description', suggestion.description)
    set(
      'specifications',
      suggestion.specifications.map((spec) => `${spec.label} : ${spec.value}`).join('\n')
    )
    set('compatibility', suggestion.compatibility.join(', '))
    set('keywords', suggestion.keywords.join(', '))
    set('seo_title', suggestion.seo_title)
    set('seo_description', suggestion.seo_description)
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          const result = await saveProduct(formData)
          if (result.ok && result.data) {
            toast.success(product ? 'Produit enregistré' : 'Produit créé', {
              key: 'produit',
              image: product?.images?.[0]?.url ?? aiImage,
              description: `« ${name} » est visible immédiatement sur le site.`,
              actions: [
                {
                  label: 'Voir la fiche',
                  href: `/produits/${slug || slugify(name)}`,
                  tone: 'neutral',
                },
              ],
            })
            if (!product) router.push(`/admin/produits/${result.data.id}`)
            else router.refresh()
          } else if (!result.ok) {
            toast.error(product ? 'Enregistrement impossible' : 'Création impossible', {
              key: 'produit',
              description: result.error,
            })
          }
        })
      }}
      className="grid gap-5 xl:grid-cols-[1.7fr_1fr]"
    >
      {product && <input type="hidden" name="id" value={product.id} />}
      {!product && aiImage && <input type="hidden" name="initial_image_url" value={aiImage} />}

      <div className="space-y-5">
        <ProductAiPanel
          categoryNames={categories.map((c) => c.name)}
          initialImage={product?.images?.[0]?.url ?? null}
          onImage={setAiImage}
          onSuggestion={applySuggestion}
        />

        <Card title="Informations générales">
          <div className="space-y-4">
            <Field label="Nom du produit *">
              <input
                name="name"
                required
                maxLength={200}
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!product) setSlug(slugify(e.target.value))
                }}
                className={inputClass}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Slug (URL)" hint="Utilisé dans l’adresse : /produits/mon-slug">
                <input
                  name="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Référence">
                <input
                  name="reference"
                  defaultValue={product?.reference ?? ''}
                  maxLength={80}
                  className={inputClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Catégorie">
                <select
                  name="category_id"
                  defaultValue={product?.category_id ?? ''}
                  className={inputClass}
                >
                  <option value="">— Aucune —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Sous-catégorie">
                <select
                  name="subcategory_id"
                  defaultValue={product?.subcategory_id ?? ''}
                  className={inputClass}
                >
                  <option value="">— Aucune —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Marque">
                <input
                  name="brand"
                  defaultValue={product?.brand ?? ''}
                  maxLength={80}
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Description courte" hint="Affichée en haut de la fiche produit.">
              <textarea
                name="short_description"
                rows={2}
                maxLength={400}
                defaultValue={product?.short_description ?? ''}
                className={textareaClass}
              />
            </Field>

            <Field label="Description complète">
              <textarea
                name="description"
                rows={8}
                maxLength={8000}
                defaultValue={product?.description ?? ''}
                className={textareaClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Caractéristiques & compatibilité">
          <div className="space-y-4">
            <Field
              label="Caractéristiques"
              hint="Une par ligne, au format « Libellé : valeur ». Ex. « Tension : 12 V »."
            >
              <textarea
                name="specifications"
                rows={5}
                defaultValue={specsText}
                placeholder={'Tension : 12 V\nCapacité : 7 Ah'}
                className={textareaClass}
              />
            </Field>

            <Field
              label="Modèles compatibles"
              hint="Séparés par une virgule ou un retour à la ligne."
            >
              <textarea
                name="compatibility"
                rows={2}
                defaultValue={(product?.compatibility ?? []).join(', ')}
                placeholder="Sirius, Boxer, TVS Star"
                className={textareaClass}
              />
            </Field>

            <Field label="Mots-clés de recherche" hint="Aident la recherche interne du site.">
              <textarea
                name="keywords"
                rows={2}
                defaultValue={(product?.keywords ?? []).join(', ')}
                placeholder="batterie, 12v, démarrage"
                className={textareaClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Référencement (SEO)">
          <div className="space-y-4">
            <Field
              label="Titre SEO"
              hint="Structure recommandée : Nom du produit | Pièces Moto Burkina Faso | SR Faso"
            >
              <input
                name="seo_title"
                maxLength={200}
                defaultValue={product?.seo_title ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="Meta description" hint="160 caractères environ.">
              <textarea
                name="seo_description"
                rows={3}
                maxLength={400}
                defaultValue={product?.seo_description ?? ''}
                className={textareaClass}
              />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Prix & stock">
          <div className="space-y-4">
            <Field label="Prix (FCFA) *">
              <input
                name="price"
                type="number"
                min={0}
                step="1"
                required
                defaultValue={product ? Number(product.price) : ''}
                className={inputClass}
              />
            </Field>
            <Field label="Ancien prix (FCFA)" hint="Laisser vide s’il n’y a pas de promotion.">
              <input
                name="old_price"
                type="number"
                min={0}
                step="1"
                defaultValue={product?.old_price ? Number(product.old_price) : ''}
                className={inputClass}
              />
            </Field>
            <Field label="Stock">
              <input
                name="stock"
                type="number"
                min={0}
                step="1"
                defaultValue={product?.stock ?? 0}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Statut & mise en avant">
          <div className="space-y-3">
            {[
              { name: 'is_active', label: 'Produit actif (visible sur le site)', value: product?.is_active ?? true },
              { name: 'is_featured', label: 'Produit en vedette', value: product?.is_featured ?? false },
              { name: 'is_new', label: 'Nouveauté', value: product?.is_new ?? false },
              { name: 'is_promo', label: 'En promotion', value: product?.is_promo ?? false },
            ].map((item) => (
              <label key={item.name} className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  name={item.name}
                  defaultChecked={item.value}
                  className={checkbox}
                />
                {item.label}
              </label>
            ))}
          </div>
        </Card>

        <div className="sticky bottom-4 rounded-2xl border border-ink-200 bg-white p-4">
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="size-4" />
            {pending ? 'Enregistrement…' : product ? 'Enregistrer' : 'Créer le produit'}
          </button>
          <p className={`${labelClass} mt-3 mb-0 text-center text-xs font-normal text-ink-400`}>
            Les modifications sont visibles immédiatement sur le site.
          </p>
        </div>
      </div>
    </form>
  )
}
