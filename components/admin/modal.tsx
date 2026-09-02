'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { cx } from '@/lib/utils'

let openCount = 0

/**
 * Boîte de dialogue du back-office : les formulaires de création et de
 * modification s'ouvrent par-dessus la liste, au lieu de la pousser vers le bas.
 *
 * Mobile d'abord : sur téléphone c'est une feuille ancrée en bas de l'écran —
 * poignée de préhension, glisser vers le bas pour fermer, actions à portée du
 * pouce, marge de sécurité sous l'encoche. À partir de `sm`, elle redevient une
 * boîte centrée classique.
 *
 * Volontairement pas de `<dialog showModal()>` : l'élément natif passe dans la
 * « top layer » du navigateur et masquerait les notifications, qui doivent
 * rester lisibles pendant l'enregistrement.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = 'md',
}: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: React.ReactNode
  size?: 'md' | 'lg'
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Le déclencheur reprend le focus à la fermeture : on ne perd pas sa place.
  const openerRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<{ startY: number } | null>(null)
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)

  const focusables = useCallback(
    () =>
      Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ) ?? []
      ).filter((el) => el.offsetParent !== null),
    []
  )

  useEffect(() => {
    if (!open) return

    openerRef.current = document.activeElement as HTMLElement | null

    // Le fond ne défile plus tant qu'une boîte est ouverte (plusieurs peuvent
    // se superposer : on ne rend la main qu'à la dernière).
    openCount += 1
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // On vise le bouton de fermeture, pas le premier champ : sur téléphone,
    // focaliser une saisie ferait surgir le clavier d'entrée de jeu.
    focusables()[0]?.focus({ preventScroll: true })

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key !== 'Tab') return

      // Piège à focus : la tabulation tourne en boucle dans la boîte.
      const items = focusables()
      if (items.length === 0) return
      const firstItem = items[0]
      const lastItem = items[items.length - 1]
      const active = document.activeElement

      if (e.shiftKey && (active === firstItem || !panelRef.current?.contains(active))) {
        e.preventDefault()
        lastItem.focus()
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault()
        firstItem.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      openCount = Math.max(0, openCount - 1)
      if (openCount === 0) document.body.style.overflow = previousOverflow
      openerRef.current?.focus({ preventScroll: true })
    }
  }, [open, onClose, focusables])

  // Clavier virtuel : `dvh` ne bouge pas quand il s'ouvre sur iOS. On suit donc
  // le viewport visible pour que les actions restent atteignables.
  useEffect(() => {
    if (!open) return
    const viewport = window.visualViewport
    if (!viewport) return

    const phone = window.matchMedia('(max-width: 639px)')
    const apply = () => {
      const el = panelRef.current
      if (!el) return
      el.style.maxHeight = phone.matches ? `${Math.round(viewport.height * 0.92)}px` : ''
    }

    apply()
    viewport.addEventListener('resize', apply)
    phone.addEventListener('change', apply)
    return () => {
      viewport.removeEventListener('resize', apply)
      phone.removeEventListener('change', apply)
    }
  }, [open])

  if (!open) return null

  /** Glisser la poignée vers le bas ferme la feuille (téléphone uniquement). */
  function endDrag() {
    const drag = dragRef.current
    dragRef.current = null
    setDragging(false)
    if (!drag) return
    // Le décalage est remis à zéro dans tous les cas : la feuille ne doit pas
    // se rouvrir décalée après une fermeture au glissement.
    setOffset(0)
    if (offset > 120) onClose()
  }

  return (
    <div className="fixed inset-0 z-90">
      <div
        aria-hidden
        onMouseDown={onClose}
        className="animate-modal-backdrop absolute inset-0 touch-none bg-ink-950/60 backdrop-blur-[2px]"
      />

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center sm:items-center sm:p-6">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            transform: offset ? `translateY(${offset}px)` : undefined,
            transition: dragging ? 'none' : 'transform 0.2s ease-out',
          }}
          className={cx(
            'animate-modal-sheet sm:animate-modal-panel pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop',
            'sm:max-h-[86dvh] sm:rounded-2xl sm:border sm:border-ink-200',
            size === 'lg' ? 'sm:max-w-3xl' : 'sm:max-w-xl'
          )}
        >
          {/* Poignée : repère visuel et zone de glissement, invisible dès sm. */}
          <div
            onPointerDown={(e) => {
              if (e.pointerType === 'mouse') return
              dragRef.current = { startY: e.clientY }
              setDragging(true)
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return
              setOffset(Math.max(0, e.clientY - dragRef.current.startY))
            }}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="shrink-0 touch-none pt-2.5 pb-1 sm:hidden"
          >
            <span aria-hidden className="mx-auto block h-1.5 w-11 rounded-full bg-ink-200" />
          </div>

          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <h3 id="modal-title" className="text-base font-bold text-ink-900 sm:text-[0.9375rem]">
                {title}
              </h3>
              {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="-mt-1 -mr-1 grid size-11 shrink-0 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-ink-50 hover:text-ink-900 sm:size-9"
            >
              <X className="size-5 sm:size-4" aria-hidden />
            </button>
          </header>

          {/* Le contenu défile dans la feuille, jamais la page derrière. */}
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Confirmation d'une action destructive. Remplace les boutons
 * « Confirmer / Annuler » qui apparaissaient au milieu des listes.
 */
export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Supprimer',
  pending = false,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  pending?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <div className="p-4 sm:p-5">
        <p className="text-sm leading-relaxed text-ink-600">{description}</p>
        <div className="pb-safe mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:pb-0">
          <button
            type="button"
            onClick={onClose}
            className="h-12 rounded-xl border border-ink-200 px-5 text-sm font-semibold text-ink-700 transition-colors hover:border-ink-900 sm:h-11"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="h-12 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:opacity-60 sm:h-11"
          >
            {pending ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  )
}
