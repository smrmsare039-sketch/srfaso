'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Bot, Loader2, RotateCcw, Send, Sparkles, X } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { cx } from '@/lib/utils'

const STORAGE_KEY = 'srfaso.chat.v1'
const MAX_MESSAGE = 2_000

/** Amorces proposées tant que le client n'a rien écrit. */
const STARTERS = [
  'Je cherche une pièce pour ma moto',
  'Quels sont vos délais de livraison ?',
  'Vous avez des casques en stock ?',
  'Où sont vos boutiques ?',
]

type Message = { id: string; role: 'user' | 'agent'; text: string }

type Stored = { sessionId: string; messages: Message[] }

function newId(): string {
  // `randomUUID` n'existe pas sur les origines non sécurisées (http en LAN).
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function readStored(): Stored | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Stored
    if (typeof parsed?.sessionId !== 'string' || !Array.isArray(parsed.messages)) return null
    return parsed
  } catch {
    return null
  }
}

const ERRORS: Record<string, string> = {
  unconfigured: "L'assistant n'est pas encore relié. Écrivez-nous sur WhatsApp en attendant.",
  timeout: 'La réponse tarde trop. Reposez votre question ou passez par WhatsApp.',
  empty: "L'assistant n'a rien renvoyé. Reformulez votre question.",
  inactive: "L'assistant n'est pas disponible pour le moment. Écrivez-nous sur WhatsApp.",
}
const ERROR_FALLBACK = "L'assistant est momentanément injoignable. Réessayez dans un instant."

export function AiChat({ companyName }: { companyName: string }) {
  const pathname = usePathname()
  const { lines, subtotal } = useCart()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState('')
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const panelId = useId()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // La conversation vit dans localStorage : elle ne peut être lue qu'après
  // l'hydratation, et elle doit survivre à un rechargement de page pour que
  // l'agent garde le fil côté n8n (même `sessionId`).
  useEffect(() => {
    const stored = readStored()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessionId(stored?.sessionId ?? newId())
    if (stored?.messages.length) setMessages(stored.messages)
  }, [])

  useEffect(() => {
    if (!sessionId) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }))
    } catch {
      // quota / navigation privée : la conversation reste en mémoire
    }
  }, [sessionId, messages])

  // Toujours afficher le dernier message, y compris pendant la frappe de l'agent.
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [open, messages, sending])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const send = useCallback(
    async (text: string) => {
      const message = text.trim().slice(0, MAX_MESSAGE)
      if (!message || sending || !sessionId) return

      setMessages((prev) => [...prev, { id: newId(), role: 'user', text: message }])
      setDraft('')
      setSending(true)

      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            message,
            // Ce que l'agent doit savoir pour orienter sans faire répéter le
            // client : où il se trouve et ce qu'il a déjà mis au panier.
            context: {
              page: pathname,
              cart: lines.map((l) => ({ name: l.name, quantity: l.quantity, price: l.price })),
              cartTotal: subtotal,
            },
          }),
        })
        const data = (await res.json().catch(() => ({}))) as { reply?: string; error?: string }
        const reply = res.ok && data.reply ? data.reply : (ERRORS[data.error ?? ''] ?? ERROR_FALLBACK)
        setMessages((prev) => [...prev, { id: newId(), role: 'agent', text: reply }])
      } catch {
        setMessages((prev) => [...prev, { id: newId(), role: 'agent', text: ERROR_FALLBACK }])
      } finally {
        setSending(false)
        inputRef.current?.focus()
      }
    },
    [lines, pathname, sending, sessionId, subtotal]
  )

  function reset() {
    setMessages([])
    setSessionId(newId())
    inputRef.current?.focus()
  }

  return (
    <>
      {/* Bouton flottant, calé juste au-dessus de celui de WhatsApp
          (bouton WhatsApp : 3rem de haut + 0.75rem d'écart). */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Fermer l'assistant" : "Discuter avec l'assistant"}
        className={cx(
          'fixed right-4 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+3.75rem)] z-40',
          'flex items-center gap-2.5 rounded-full py-3 pr-5 pl-3 font-semibold text-white',
          'bg-gradient-to-br from-brand-700 to-brand-900',
          'shadow-pop transition-transform hover:scale-105',
          open && 'pointer-events-none opacity-0'
        )}
      >
        <span className="grid size-6 shrink-0 place-items-center">
          <Sparkles className="size-5" aria-hidden />
        </span>
        <span className="hidden text-sm sm:inline">Assistant</span>
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-label={`Assistant ${companyName}`}
          className={cx(
            'fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-pop',
            'inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] top-auto',
            'h-[min(32rem,calc(100dvh-6rem))]',
            'sm:inset-x-auto sm:right-4 sm:w-[23rem]'
          )}
        >
          <header className="flex shrink-0 items-center gap-3 bg-brand-800 px-4 py-3 text-white">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/20">
              <Bot className="size-5" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-bold">Assistant {companyName}</span>
              <span className="block text-xs text-white/80">Conseil et commande</span>
            </span>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={reset}
                aria-label="Nouvelle conversation"
                title="Nouvelle conversation"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="size-4" aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer l'assistant"
              className="grid size-8 shrink-0 place-items-center rounded-lg text-white/80 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div
            className="scroll-thin flex-1 space-y-3 overflow-y-auto p-4"
            aria-live="polite"
            aria-busy={sending}
          >
            {messages.length === 0 && (
              <>
                <p className="rounded-2xl rounded-bl-md bg-ink-50 px-3.5 py-2.5 text-sm leading-relaxed text-ink-800">
                  Bonjour 👋 Je suis l&apos;assistant {companyName}. Dites-moi ce que vous cherchez
                  et je vous oriente vers la bonne pièce, le bon prix et la bonne boutique.
                </p>
                <ul className="flex flex-wrap gap-2 pt-1">
                  {STARTERS.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => send(s)}
                        className="rounded-full border border-ink-200 px-3 py-1.5 text-left text-xs font-semibold text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-800"
                      >
                        {s}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {messages.map((m) => (
              <p
                key={m.id}
                className={cx(
                  'max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'ml-auto rounded-2xl rounded-br-md bg-brand-800 text-white'
                    : 'rounded-2xl rounded-bl-md bg-ink-50 text-ink-800'
                )}
              >
                {m.text}
              </p>
            ))}

            {sending && (
              <p className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-ink-50 px-3.5 py-2.5 text-sm text-ink-500">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                L&apos;assistant réfléchit…
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(draft)
            }}
            className="flex shrink-0 items-end gap-2 border-t border-ink-100 p-3"
          >
            <label htmlFor={`${panelId}-input`} className="sr-only">
              Votre message
            </label>
            <textarea
              id={`${panelId}-input`}
              ref={inputRef}
              rows={1}
              value={draft}
              maxLength={MAX_MESSAGE}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                // Entrée envoie, Maj+Entrée passe à la ligne.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(draft)
                }
              }}
              placeholder="Écrivez votre message…"
              className="scroll-thin max-h-28 min-h-11 flex-1 resize-none rounded-xl border border-ink-200 px-3.5 py-2.5 text-sm text-ink-900 outline-none transition-colors focus:border-brand-500 placeholder:text-ink-400"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Envoyer"
              className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-800 text-white transition-colors hover:bg-brand-900 disabled:opacity-40"
            >
              <Send className="size-5" aria-hidden />
            </button>
          </form>

          <p className="shrink-0 border-t border-ink-100 px-4 py-2 text-center text-[0.6875rem] text-ink-400">
            Réponses générées automatiquement.{' '}
            <Link href="/contact" className="font-semibold text-brand-800 hover:underline">
              Contacter un conseiller
            </Link>
          </p>
        </div>
      )}
    </>
  )
}
