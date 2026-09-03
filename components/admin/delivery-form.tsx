'use client'

import { useState, useTransition } from 'react'
import { Save } from 'lucide-react'
import { Card, Field, inputClass, textareaClass } from '@/components/admin/ui'
import { useToast } from '@/components/toast'
import { RichText } from '@/components/rich-text'
import { saveDeliveryContent } from '@/lib/actions/admin'
import type { DeliveryContent } from '@/lib/types'

export function DeliveryForm({ content }: { content: DeliveryContent | null }) {
  const [pending, startTransition] = useTransition()
  const [deliveryBody, setDeliveryBody] = useState(content?.delivery_body ?? '')
  const [returnBody, setReturnBody] = useState(content?.return_body ?? '')
  const toast = useToast()

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await saveDeliveryContent(formData)
          if (result.ok) {
            toast.success('Contenu enregistré', {
              key: 'livraison',
              description: 'La page Livraison & retour est à jour.',
              actions: [
                { label: 'Voir la page', href: '/livraison-retour', tone: 'neutral' },
              ],
            })
          } else {
            toast.error('Enregistrement impossible', {
              key: 'livraison',
              description: result.error,
            })
          }
        })
      }}
      className="space-y-5"
    >
      <Card
        title="Livraison"
        description="Syntaxe : ## titre, ### sous-titre, - liste, 1. liste numérotée, **gras**."
      >
        <div className="space-y-4">
          <Field label="Titre de la section">
            <input
              name="delivery_title"
              defaultValue={content?.delivery_title ?? 'Livraison'}
              className={inputClass}
            />
          </Field>
          <Field label="Contenu">
            <textarea
              name="delivery_body"
              rows={14}
              value={deliveryBody}
              onChange={(e) => setDeliveryBody(e.target.value)}
              className={`${textareaClass} font-mono text-[0.8125rem]`}
            />
          </Field>
          {deliveryBody && (
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                Aperçu
              </p>
              <RichText content={deliveryBody} />
            </div>
          )}
        </div>
      </Card>

      <Card title="Retour & échange">
        <div className="space-y-4">
          <Field label="Titre de la section">
            <input
              name="return_title"
              defaultValue={content?.return_title ?? 'Retour'}
              className={inputClass}
            />
          </Field>
          <Field label="Contenu">
            <textarea
              name="return_body"
              rows={14}
              value={returnBody}
              onChange={(e) => setReturnBody(e.target.value)}
              className={`${textareaClass} font-mono text-[0.8125rem]`}
            />
          </Field>
          {returnBody && (
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
              <p className="mb-2 text-xs font-bold tracking-wider text-ink-400 uppercase">
                Aperçu
              </p>
              <RichText content={returnBody} />
            </div>
          )}
        </div>
      </Card>

      <Card title="Référencement de la page">
        <div className="space-y-4">
          <Field label="Titre SEO">
            <input name="seo_title" defaultValue={content?.seo_title ?? ''} className={inputClass} />
          </Field>
          <Field label="Meta description">
            <textarea
              name="seo_description"
              rows={3}
              defaultValue={content?.seo_description ?? ''}
              className={textareaClass}
            />
          </Field>
        </div>
      </Card>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-8 text-sm font-bold text-ink-900 hover:bg-brand-700 disabled:opacity-60"
      >
        <Save className="size-4" />
        {pending ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  )
}
