'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { saveSettings } from '@/lib/actions/admin'
import { HERO_BACKGROUNDS, HERO_TILES_MAX } from '@/lib/types'
import type { HeroTile, SiteSettings } from '@/lib/types'

function ImageField({
  label,
  name,
  value,
  onChange,
  folder,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (url: string) => void
  folder: string
  hint?: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink-800">{label}</p>
      <input type="hidden" name={name} value={value} />
      {value && (
        <div className="relative mb-3 h-24 w-fit min-w-32 overflow-hidden rounded-xl border border-ink-100 bg-ink-50 p-3">
          <Image
            src={value}
            alt=""
            width={200}
            height={80}
            className="h-full w-auto object-contain"
          />
        </div>
      )}
      <div className="flex items-center gap-2">
        <ImageUploader
          folder={folder}
          baseName={name}
          label={value ? 'Remplacer' : 'Envoyer une image'}
          onUploaded={(url) => onChange(url)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
          >
            Retirer
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function VideoField({
  label,
  name,
  value,
  onChange,
  folder,
  hint,
}: {
  label: string
  name: string
  value: string
  onChange: (url: string) => void
  folder: string
  hint?: string
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink-800">{label}</p>
      <input type="hidden" name={name} value={value} />
      {value && (
        <video
          src={value}
          muted
          loop
          playsInline
          controls
          className="mb-3 aspect-video w-full rounded-xl border border-ink-100 bg-ink-950 object-cover"
        />
      )}
      <div className="flex items-center gap-2">
        <ImageUploader
          folder={folder}
          baseName={name}
          kind="video"
          label={value ? 'Remplacer la vidéo' : 'Envoyer une vidéo'}
          onUploaded={(url) => onChange(url)}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
          >
            Retirer
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

const EMPTY_TILE: HeroTile = { url: '', video: null, label: null, href: null }

function HeroTilesField({
  tiles,
  onChange,
}: {
  tiles: HeroTile[]
  onChange: (tiles: HeroTile[]) => void
}) {
  function update(index: number, patch: Partial<HeroTile>) {
    onChange(tiles.map((tile, i) => (i === index ? { ...tile, ...patch } : tile)))
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink-800">Mosaïque de la bannière</p>
      <p className="mb-3 text-xs text-ink-400">
        Jusqu’à {HERO_TILES_MAX} visuels affichés à droite de la bannière : une image ou une vidéo
        pour chacun. Laissez tout vide pour afficher automatiquement les produits populaires.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {tiles.map((tile, index) => (
          <div key={index} className="rounded-2xl border border-ink-100 p-3">
            <p className="mb-2 text-xs font-semibold tracking-wider text-ink-400 uppercase">
              Visuel {index + 1}
            </p>
            <input type="hidden" name={`hero_tile_${index + 1}_image`} value={tile.url} />
            <input type="hidden" name={`hero_tile_${index + 1}_video`} value={tile.video ?? ''} />
            <div className="relative mb-3 grid aspect-square place-items-center overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
              {tile.video ? (
                <video
                  src={tile.video}
                  poster={tile.url || undefined}
                  muted
                  loop
                  playsInline
                  controls
                  className="size-full bg-ink-900 object-cover"
                />
              ) : tile.url ? (
                <Image src={tile.url} alt="" fill sizes="200px" className="object-cover" />
              ) : (
                <span className="text-xs text-ink-400">Aucun visuel</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ImageUploader
                folder="accueil"
                baseName={`banniere-${index + 1}`}
                label={tile.url ? 'Remplacer l’image' : 'Image'}
                onUploaded={(url) => update(index, { url })}
              />
              <ImageUploader
                folder="accueil"
                baseName={`banniere-${index + 1}-video`}
                kind="video"
                label={tile.video ? 'Remplacer la vidéo' : 'Vidéo'}
                onUploaded={(video) => update(index, { video })}
              />
              {(tile.url || tile.video) && (
                <button
                  type="button"
                  onClick={() => update(index, { ...EMPTY_TILE })}
                  className="h-11 rounded-xl border border-ink-200 px-4 text-sm font-semibold text-ink-600 hover:border-brand-400 hover:text-brand-600"
                >
                  Retirer
                </button>
              )}
            </div>
            {tile.video && (
              <p className="mt-2 text-xs text-ink-400">
                La vidéo est affichée à la place de l’image ; l’image sert d’attente au chargement.
              </p>
            )}
            <div className="mt-3 space-y-2">
              <input
                name={`hero_tile_${index + 1}_label`}
                value={tile.label ?? ''}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="Légende (ex. Batteries moto)"
                className={inputClass}
              />
              <input
                name={`hero_tile_${index + 1}_href`}
                value={tile.href ?? ''}
                onChange={(e) => update(index, { href: e.target.value })}
                placeholder="Lien (ex. /categories/batteries)"
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [pending, startTransition] = useTransition()
  const [logo, setLogo] = useState(settings.logo_url ?? '')
  const [favicon, setFavicon] = useState(settings.favicon_url ?? '')
  const [ogImage, setOgImage] = useState(settings.og_image_url ?? '')
  const [heroImage, setHeroImage] = useState(settings.home_hero_image ?? '')
  const [heroVideo, setHeroVideo] = useState(settings.home_hero_video ?? '')
  const [heroTiles, setHeroTiles] = useState<HeroTile[]>(() =>
    Array.from({ length: HERO_TILES_MAX }, (_, i) => settings.home_hero_tiles[i] ?? EMPTY_TILE)
  )
  const toast = useToast()

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await saveSettings(formData)
          if (result.ok) {
            toast.success('Paramètres enregistrés', {
              key: 'parametres',
              description: 'Le site public reflète déjà vos modifications.',
              actions: [{ label: 'Voir le site', href: '/', tone: 'neutral' }],
            })
          } else {
            toast.error('Enregistrement impossible', {
              key: 'parametres',
              description: result.error,
            })
          }
        })
      }}
      className="grid gap-5 xl:grid-cols-2"
    >
      <div className="space-y-5">
        <Card title="Identité">
          <div className="space-y-4">
            <Field label="Nom de l’entreprise">
              <input
                name="company_name"
                defaultValue={settings.company_name}
                className={inputClass}
              />
            </Field>
            <Field label="Accroche">
              <input name="tagline" defaultValue={settings.tagline ?? ''} className={inputClass} />
            </Field>
            <ImageField
              label="Logo"
              name="logo_url"
              value={logo}
              onChange={setLogo}
              folder="identite"
              hint="Affiché dans l’en-tête. Format horizontal recommandé (PNG transparent)."
            />
            <ImageField
              label="Favicon"
              name="favicon_url"
              value={favicon}
              onChange={setFavicon}
              folder="identite"
            />
          </div>
        </Card>

        <Card title="Contact">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone principal">
                <input
                  name="phone_primary"
                  defaultValue={settings.phone_primary ?? ''}
                  className={inputClass}
                />
              </Field>
              <Field label="Téléphone secondaire">
                <input
                  name="phone_secondary"
                  defaultValue={settings.phone_secondary ?? ''}
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label="Numéro WhatsApp" hint="Format international, ex. +22660002220.">
              <input name="whatsapp" defaultValue={settings.whatsapp ?? ''} className={inputClass} />
            </Field>
            <Field label="Message WhatsApp pré-rempli">
              <textarea
                name="whatsapp_message"
                rows={2}
                defaultValue={settings.whatsapp_message ?? ''}
                className={textareaClass}
              />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" defaultValue={settings.email ?? ''} className={inputClass} />
            </Field>
            <Field label="Adresse">
              <input name="address" defaultValue={settings.address ?? ''} className={inputClass} />
            </Field>
            <Field label="Horaires">
              <input name="hours" defaultValue={settings.hours ?? ''} className={inputClass} />
            </Field>
          </div>
        </Card>

        <Card title="Bandeau livraison (en-tête)">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Titre">
              <input
                name="delivery_title"
                defaultValue={settings.delivery_title ?? 'Livraison'}
                className={inputClass}
              />
            </Field>
            <Field label="Texte">
              <input
                name="delivery_text"
                defaultValue={settings.delivery_text ?? 'Partout au Faso'}
                className={inputClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Réseaux sociaux">
          <div className="space-y-4">
            <Field label="Facebook">
              <input name="facebook_url" defaultValue={settings.facebook_url ?? ''} className={inputClass} />
            </Field>
            <Field label="TikTok">
              <input name="tiktok_url" defaultValue={settings.tiktok_url ?? ''} className={inputClass} />
            </Field>
            <Field label="Instagram">
              <input name="instagram_url" defaultValue={settings.instagram_url ?? ''} className={inputClass} />
            </Field>
            <Field label="YouTube">
              <input name="youtube_url" defaultValue={settings.youtube_url ?? ''} className={inputClass} />
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-5">
        <Card title="Page d’accueil">
          <div className="space-y-4">
            <Field label="Titre de la bannière">
              <input
                name="home_hero_title"
                defaultValue={settings.home_hero_title ?? ''}
                className={inputClass}
              />
            </Field>
            <Field label="Sous-titre de la bannière">
              <textarea
                name="home_hero_subtitle"
                rows={3}
                defaultValue={settings.home_hero_subtitle ?? ''}
                className={textareaClass}
              />
            </Field>
            <Field
              label="Fond de la bannière"
              hint="Le rouge de la marque est appliqué par défaut."
            >
              <select
                name="home_hero_bg"
                defaultValue={settings.home_hero_bg}
                className={inputClass}
              >
                {Object.entries(HERO_BACKGROUNDS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <ImageField
              label="Image de la bannière"
              name="home_hero_image"
              value={heroImage}
              onChange={setHeroImage}
              folder="accueil"
              hint="Grande image unique. Si elle est vide, la mosaïque ci-dessous est utilisée."
            />
            <VideoField
              label="Vidéo de la bannière"
              name="home_hero_video"
              value={heroVideo}
              onChange={setHeroVideo}
              folder="accueil"
              hint="MP4 ou WebM, 25 Mo maximum. Prioritaire sur l’image : la vidéo est lue en boucle, sans son. L’image ci-dessus sert alors d’aperçu au chargement."
            />
            <HeroTilesField tiles={heroTiles} onChange={setHeroTiles} />
            <Field
              label="Bloc SEO rédactionnel"
              hint="Séparez les paragraphes par une ligne vide. Contenu naturel, sans bourrage de mots-clés."
            >
              <textarea
                name="home_seo_content"
                rows={10}
                defaultValue={settings.home_seo_content ?? ''}
                className={textareaClass}
              />
            </Field>
          </div>
        </Card>

        <Card title="Référencement global">
          <div className="space-y-4">
            <Field label="Titre SEO par défaut">
              <input name="seo_title" defaultValue={settings.seo_title ?? ''} className={inputClass} />
            </Field>
            <Field label="Meta description par défaut">
              <textarea
                name="seo_description"
                rows={3}
                defaultValue={settings.seo_description ?? ''}
                className={textareaClass}
              />
            </Field>
            <Field label="Mots-clés" hint="Séparés par des virgules.">
              <textarea
                name="seo_keywords"
                rows={3}
                defaultValue={settings.seo_keywords ?? ''}
                className={textareaClass}
              />
            </Field>
            <ImageField
              label="Image de partage (Open Graph)"
              name="og_image_url"
              value={ogImage}
              onChange={setOgImage}
              folder="identite"
              hint="1200 × 630 pixels recommandés."
            />
          </div>
        </Card>

        <div className="sticky bottom-4 rounded-2xl border border-ink-200 bg-white p-4">
          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Save className="size-4" />
            {pending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>
      </div>
    </form>
  )
}
