'use client'

import { useRef, useState } from 'react'
import { FileVideo, ImagePlus, Loader2 } from 'lucide-react'
import { useToast } from '@/components/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { slugify } from '@/lib/utils'

export type MediaKind = 'image' | 'video'

const LIMITS: Record<MediaKind, { maxSize: number; accept: string; error: string; tooBig: string }> =
  {
    image: {
      maxSize: 5 * 1024 * 1024,
      accept: 'image/*',
      error: 'Le fichier doit être une image.',
      tooBig: 'L’image ne doit pas dépasser 5 Mo.',
    },
    video: {
      maxSize: 25 * 1024 * 1024,
      accept: 'video/mp4,video/webm',
      error: 'Le fichier doit être une vidéo MP4 ou WebM.',
      tooBig: 'La vidéo ne doit pas dépasser 25 Mo.',
    },
  }

/**
 * Envoie un fichier dans le bucket "media" et renvoie son URL publique.
 * Le nom du fichier est normalisé pour rester lisible (SEO images).
 */
export async function uploadToStorage(
  file: File,
  folder: string,
  baseName?: string,
  kind: MediaKind = 'image'
): Promise<{ url: string } | { error: string }> {
  const limit = LIMITS[kind]
  if (!file.type.startsWith(`${kind}/`)) return { error: limit.error }
  if (file.size > limit.maxSize) return { error: limit.tooBig }

  const extension = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
  const stem = slugify(baseName || file.name.replace(/\.[^.]+$/, '')) || 'image'
  const path = `${folder}/${stem}-${Date.now().toString(36)}.${extension}`

  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.storage.from('media').upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) return { error: error.message }

  const { data } = supabase.storage.from('media').getPublicUrl(path)
  return { url: data.publicUrl }
}

export function ImageUploader({
  folder,
  baseName,
  label = 'Ajouter une image',
  multiple = false,
  kind = 'image',
  onUploaded,
}: {
  folder: string
  baseName?: string
  label?: string
  multiple?: boolean
  kind?: MediaKind
  onUploaded: (url: string, fileName: string) => void | Promise<void>
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  const noun = kind === 'video' ? 'vidéo' : 'image'

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)

    const total = files.length
    const pendingId = toast.loading(
      total > 1 ? `Envoi de ${total} ${noun}s…` : `Envoi de la ${noun}…`,
      { key: 'televersement', description: 'Ne quittez pas la page pendant l’envoi.' }
    )

    let sent = 0
    let failure: string | null = null
    let lastUrl: string | null = null

    for (const file of Array.from(files)) {
      const result = await uploadToStorage(file, folder, baseName, kind)
      if ('error' in result) {
        failure = result.error
        break
      }
      lastUrl = result.url
      sent += 1
      await onUploaded(result.url, file.name.replace(/\.[^.]+$/, ''))
    }

    if (failure) {
      toast.update(pendingId, 'error', `Envoi de la ${noun} interrompu`, {
        description:
          sent > 0 ? `${sent} fichier(s) envoyé(s) avant l’erreur. ${failure}` : failure,
      })
    } else {
      toast.update(pendingId, 'success', sent > 1 ? `${sent} ${noun}s envoyées` : `${noun.charAt(0).toUpperCase()}${noun.slice(1)} envoyée`, {
        description: 'Le fichier est disponible dans la médiathèque.',
        image: kind === 'image' ? lastUrl : null,
      })
    }

    setBusy(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={LIMITS[kind].accept}
        multiple={multiple}
        hidden
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-11 items-center gap-2 rounded-xl border border-dashed border-ink-300 px-4 text-sm font-semibold text-ink-700 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : kind === 'video' ? (
          <FileVideo className="size-4" />
        ) : (
          <ImagePlus className="size-4" />
        )}
        {busy ? 'Envoi…' : label}
      </button>
    </div>
  )
}
