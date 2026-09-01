'use client'

import Image from 'next/image'
import { useState, useTransition } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { ImageUploader } from '@/components/admin/image-uploader'
import { Card } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { analyzeProductImage, type ProductSuggestion } from '@/lib/actions/ai'

export function ProductAiPanel({
  categoryNames,
  initialImage,
  onImage,
  onSuggestion,
}: {
  categoryNames: string[]
  initialImage?: string | null
  /** Remonte l'image envoyée pour qu'elle soit attachée au produit à l'enregistrement. */
  onImage: (url: string | null) => void
  onSuggestion: (suggestion: ProductSuggestion) => void
}) {
  const [image, setImage] = useState<string | null>(initialImage ?? null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()
  const toast = useToast()

  function analyze(url: string) {
    setDone(false)
    const analysisId = toast.loading('Analyse de la photo en cours…', {
      key: 'analyse-ia',
      image: url,
      description: 'L’IA rédige le nom, la description et le SEO du produit.',
    })
    startTransition(async () => {
      const result = await analyzeProductImage(url, categoryNames)
      if (!result.ok) {
        toast.update(analysisId, 'error', 'Analyse impossible', {
          description: result.error,
        })
        return
      }
      onSuggestion(result.data)
      setDone(true)
      toast.update(analysisId, 'success', 'Fiche pré-remplie', {
        image: url,
        description:
          result.data.notes || 'Relisez et corrigez la proposition avant d’enregistrer.',
      })
    })
  }

  return (
    <Card
      title="Analyse IA de la photo"
      description="Envoyez la photo du produit : l’IA propose le nom, la description et le SEO. Les prix, le stock et les statuts restent à votre main."
    >
      <div className="flex flex-wrap items-start gap-5">
        <div className="relative size-28 shrink-0 overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
          {image ? (
            <Image src={image} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-xs text-ink-400">Aucune photo</span>
          )}
        </div>

        <div className="min-w-56 flex-1 space-y-3">
          <ImageUploader
            folder="produits"
            label={image ? 'Changer la photo' : 'Envoyer la photo du produit'}
            onUploaded={(url) => {
              setImage(url)
              onImage(url)
              analyze(url)
            }}
          />

          <button
            type="button"
            disabled={!image || pending}
            onClick={() => image && analyze(image)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Sparkles className="size-4" aria-hidden />
            )}
            {pending ? 'Analyse en cours…' : done ? 'Relancer l’analyse' : 'Analyser la photo'}
          </button>

        </div>
      </div>
    </Card>
  )
}
