'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertTriangle, CheckCircle2, Info, Loader2, X, XCircle } from 'lucide-react'
import { cx } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastAction = {
  label: string
  /** Lien interne : rendu avec next/link, ferme le toast au clic. */
  href?: string
  onClick?: () => void
  tone?: 'primary' | 'neutral'
}

export type ToastOptions = {
  /** Phrase de contexte : ce qui s’est passé, ou quoi faire ensuite. */
  description?: string
  /** Millisecondes. `0` rend le toast persistant (fermeture manuelle). */
  duration?: number
  /** Vignette (produit, image envoyée…). */
  image?: string | null
  actions?: ToastAction[]
  /**
   * Deux appels avec la même clé mettent à jour le toast existant au lieu
   * d’en empiler un second — utile pour les clics répétés sur un bouton.
   */
  key?: string
}

type ToastItem = {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration: number
  image?: string | null
  actions?: ToastAction[]
  key?: string
  /** Incrémenté à chaque mise à jour : relance l’animation et le minuteur. */
  revision: number
  closing?: boolean
}

/** Combien de toasts restent visibles simultanément : au-delà, c’est du bruit. */
const MAX_VISIBLE = 3
const EXIT_MS = 220

/** Durées par défaut : plus le message est grave, plus il reste affiché. */
const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4500,
  info: 5000,
  warning: 6500,
  error: 8000,
  loading: 0,
}

/** Titre de repli en français, si l’appelant n’en fournit pas. */
const FALLBACK_TITLE: Record<ToastVariant, string> = {
  success: 'C’est fait',
  info: 'Information',
  warning: 'Attention',
  error: 'Une erreur est survenue',
  loading: 'Traitement en cours…',
}

const VARIANT_LABEL: Record<ToastVariant, string> = {
  success: 'Succès',
  info: 'Information',
  warning: 'Avertissement',
  error: 'Erreur',
  loading: 'En cours',
}

const STYLES: Record<
  ToastVariant,
  { icon: typeof CheckCircle2; ring: string; badge: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: 'border-green-200',
    badge: 'bg-green-50 text-green-600',
    bar: 'bg-green-500',
  },
  error: {
    icon: XCircle,
    ring: 'border-brand-200',
    badge: 'bg-brand-50 text-brand-600',
    bar: 'bg-brand-500',
  },
  warning: {
    icon: AlertTriangle,
    ring: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-600',
    bar: 'bg-amber-500',
  },
  info: {
    icon: Info,
    ring: 'border-ink-200',
    badge: 'bg-ink-100 text-ink-700',
    bar: 'bg-ink-400',
  },
  loading: {
    icon: Loader2,
    ring: 'border-ink-200',
    badge: 'bg-ink-100 text-ink-700',
    bar: 'bg-ink-300',
  },
}

type ShowFn = (title: string, options?: ToastOptions) => string

type ToastApi = {
  success: ShowFn
  error: ShowFn
  warning: ShowFn
  info: ShowFn
  loading: ShowFn
  show: (variant: ToastVariant, title: string, options?: ToastOptions) => string
  /** Transforme un toast existant (typiquement « en cours » → « réussi »). */
  update: (id: string, variant: ToastVariant, title: string, options?: ToastOptions) => void
  /** Sans argument : ferme toute la pile. */
  dismiss: (id?: string) => void
  /** Enchaîne « en cours » → « réussi » / « échoué » autour d’une promesse. */
  promise: <T>(
    task: Promise<T>,
    messages: {
      loading: string
      success: string | ((value: T) => string)
      error: string | ((reason: unknown) => string)
      options?: ToastOptions
    }
  ) => Promise<T>
}

const ToastContext = createContext<ToastApi | null>(null)

let counter = 0
const nextId = () => `t${(counter += 1)}`

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const exitTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  useEffect(() => {
    const timers = exitTimers.current
    return () => {
      timers.forEach(clearTimeout)
      timers.clear()
    }
  }, [])

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
    const timer = exitTimers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      exitTimers.current.delete(id)
    }
  }, [])

  /** Marque le toast comme sortant : il s’anime avant d’être retiré du DOM. */
  const dismiss = useCallback(
    (id?: string) => {
      setToasts((current) => {
        const targets = id ? current.filter((t) => t.id === id) : current
        targets.forEach((t) => {
          if (exitTimers.current.has(t.id)) return
          exitTimers.current.set(
            t.id,
            setTimeout(() => remove(t.id), EXIT_MS)
          )
        })
        return current.map((t) => (!id || t.id === id ? { ...t, closing: true } : t))
      })
    },
    [remove]
  )

  const show = useCallback<ToastApi['show']>((variant, title, options) => {
    const id = nextId()
    setToasts((current) => {
      const item: ToastItem = {
        id,
        variant,
        title: title || FALLBACK_TITLE[variant],
        duration: options?.duration ?? DEFAULT_DURATION[variant],
        description: options?.description,
        image: options?.image,
        actions: options?.actions,
        key: options?.key,
        revision: 0,
      }

      // Même clé → on remplace le toast en place, pas d’empilement de doublons.
      const existing = options?.key
        ? current.find((t) => t.key === options.key && !t.closing)
        : undefined
      if (existing) {
        return current.map((t) =>
          t.id === existing.id ? { ...item, id: t.id, revision: t.revision + 1 } : t
        )
      }

      const next = [...current.filter((t) => !t.closing), item]
      // Au-delà de la pile visible, les plus anciens disparaissent aussitôt.
      return next.slice(-MAX_VISIBLE)
    })
    return id
  }, [])

  const update = useCallback<ToastApi['update']>((id, variant, title, options) => {
    setToasts((current) =>
      current.map((t) =>
        t.id === id
          ? {
              ...t,
              variant,
              title: title || FALLBACK_TITLE[variant],
              duration: options?.duration ?? DEFAULT_DURATION[variant],
              description: options?.description,
              image: options?.image ?? t.image,
              actions: options?.actions,
              closing: false,
              revision: t.revision + 1,
            }
          : t
      )
    )
  }, [])

  const api = useMemo<ToastApi>(() => {
    const bound =
      (variant: ToastVariant): ShowFn =>
      (title, options) =>
        show(variant, title, options)

    return {
      show,
      update,
      dismiss,
      success: bound('success'),
      error: bound('error'),
      warning: bound('warning'),
      info: bound('info'),
      loading: bound('loading'),
      async promise(task, messages) {
        const id = show('loading', messages.loading, messages.options)
        try {
          const value = await task
          update(
            id,
            'success',
            typeof messages.success === 'function' ? messages.success(value) : messages.success,
            messages.options
          )
          return value
        } catch (reason) {
          update(
            id,
            'error',
            typeof messages.error === 'function' ? messages.error(reason) : messages.error,
            messages.options
          )
          throw reason
        }
      },
    }
  }, [show, update, dismiss])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider')
  return ctx
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id?: string) => void
}) {
  // Échap ferme la pile : raccourci attendu pour toute notification transitoire.
  useEffect(() => {
    if (toasts.length === 0) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toasts.length, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2.5 p-3 sm:inset-x-auto sm:top-4 sm:right-4 sm:items-end sm:p-0"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onDismiss(toast.id)} />
      ))}
    </div>
  )
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const style = STYLES[toast.variant]
  const Icon = style.icon
  const barRef = useRef<HTMLSpanElement | null>(null)
  const pausedRef = useRef(false)
  const dragRef = useRef<{ startX: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  // Minuteur en rAF : la barre de progression et la fermeture partagent le même
  // décompte, et une pause (survol, focus, onglet masqué) n’en consomme pas.
  useEffect(() => {
    const total = toast.duration
    if (!total || toast.closing) return

    let raf = 0
    let remaining = total
    let last = performance.now()

    const tick = (now: number) => {
      const delta = now - last
      last = now
      if (!pausedRef.current && !document.hidden) remaining -= delta
      const ratio = Math.max(0, remaining / total)
      if (barRef.current) barRef.current.style.transform = `scaleX(${ratio})`
      if (remaining <= 0) {
        onDismiss()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [toast.duration, toast.revision, toast.closing, onDismiss])

  function endDrag(clientX: number) {
    const drag = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!drag) return
    // Au-delà d’un tiers de la largeur usuelle, le geste vaut fermeture.
    if (Math.abs(clientX - drag.startX) > 90) onDismiss()
    else setOffset(0)
  }

  return (
    <article
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onPointerEnter={() => {
        pausedRef.current = true
      }}
      onPointerLeave={() => {
        pausedRef.current = false
      }}
      onFocusCapture={() => {
        pausedRef.current = true
      }}
      onBlurCapture={() => {
        pausedRef.current = false
      }}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return
        dragRef.current = { startX: e.clientX }
        setDragging(true)
      }}
      onPointerMove={(e) => {
        if (!dragRef.current) return
        setOffset(e.clientX - dragRef.current.startX)
      }}
      onPointerUp={(e) => endDrag(e.clientX)}
      onPointerCancel={(e) => endDrag(e.clientX)}
      style={{
        transform: offset ? `translateX(${offset}px)` : undefined,
        opacity: offset ? Math.max(0.25, 1 - Math.abs(offset) / 220) : undefined,
        transition: dragging ? 'none' : 'transform 0.18s ease-out, opacity 0.18s ease-out',
        touchAction: 'pan-y',
      }}
      className={cx(
        'pointer-events-auto relative w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border bg-white shadow-pop select-none',
        style.ring,
        toast.closing ? 'animate-toast-out' : 'animate-toast-in'
      )}
    >
      <div className="flex items-start gap-3 p-3.5">
        {toast.image ? (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-ink-100 bg-ink-50">
            <Image src={toast.image} alt="" fill sizes="44px" className="object-cover" />
          </span>
        ) : (
          <span className={cx('grid size-9 shrink-0 place-items-center rounded-full', style.badge)}>
            <Icon
              className={cx('size-5', toast.variant === 'loading' && 'animate-spin')}
              aria-hidden
            />
          </span>
        )}

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-sm leading-snug font-bold text-ink-900">
            <span className="sr-only">{VARIANT_LABEL[toast.variant]} : </span>
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm leading-snug break-words text-ink-500">
              {toast.description}
            </p>
          )}

          {toast.actions && toast.actions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {toast.actions.map((action) => {
                const className = cx(
                  'inline-flex h-9 items-center justify-center rounded-xl px-3.5 text-sm font-bold transition-colors',
                  action.tone === 'neutral'
                    ? 'border border-ink-200 text-ink-800 hover:border-ink-900'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                )
                return action.href ? (
                  <Link
                    key={action.label}
                    href={action.href}
                    onClick={() => {
                      action.onClick?.()
                      onDismiss()
                    }}
                    className={className}
                  >
                    {action.label}
                  </Link>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => {
                      action.onClick?.()
                      onDismiss()
                    }}
                    className={className}
                  >
                    {action.label}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Fermer la notification"
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      {toast.duration > 0 && (
        <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 overflow-hidden bg-ink-100">
          <span
            ref={barRef}
            className={cx('block h-full origin-left', style.bar)}
            style={{ transform: 'scaleX(1)' }}
          />
        </span>
      )}
    </article>
  )
}
