'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { useToast } from '@/components/toast'
import { sendContactMessage } from '@/lib/actions/public'

const field =
  'h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'
const label = 'mb-1.5 block text-sm font-semibold text-ink-800'

export function ContactForm() {
  const [pending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const toast = useToast()

  if (sent) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-green-600" strokeWidth={1.5} />
        <p className="mt-4 text-lg font-bold text-green-900">
          Votre message a bien été envoyé.
        </p>
        <p className="mt-1.5 text-sm text-green-800">
          Notre équipe vous répond dans les meilleurs délais.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-xl border border-green-300 px-5 py-2.5 text-sm font-semibold text-green-900"
        >
          Envoyer un autre message
        </button>
      </div>
    )
  }

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await sendContactMessage(formData)
          if (result.ok) {
            setSent(true)
            toast.success('Message envoyé', {
              key: 'contact',
              description: 'Notre équipe vous répond dans les meilleurs délais.',
            })
          } else {
            toast.error('Message non envoyé', { key: 'contact', description: result.error })
          }
        })
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={label}>
            Nom complet <span className="text-brand-600">*</span>
          </label>
          <input id="name" name="name" required maxLength={120} className={field} />
        </div>
        <div>
          <label htmlFor="phone" className={label}>
            Téléphone <span className="text-brand-600">*</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="+226 ..."
            className={field}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={label}>
            E-mail <span className="font-normal text-ink-400">(facultatif)</span>
          </label>
          <input id="email" name="email" type="email" className={field} />
        </div>
        <div>
          <label htmlFor="subject" className={label}>
            Sujet
          </label>
          <input id="subject" name="subject" maxLength={160} className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="message" className={label}>
          Message <span className="text-brand-600">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          maxLength={4000}
          className="w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-[0.9375rem] text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500"
        />
      </div>

      {/* piège à robots */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[0.9375rem] font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        <Send className="size-4" aria-hidden />
        {pending ? 'Envoi…' : 'Envoyer le message'}
      </button>
    </form>
  )
}
