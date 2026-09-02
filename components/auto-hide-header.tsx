'use client'

import { useEffect, useRef } from 'react'

/** En deçà de ce déplacement, on considère que l'utilisateur n'a pas changé d'avis. */
const THRESHOLD = 6

/** Temps d'affichage après un défilement vers le haut, si l'en-tête reste inutilisé. */
const AUTO_HIDE_MS = 1000

/**
 * En-tête à masquage automatique : il défile normalement avec la page, se
 * retire quand on descend, et revient dès qu'on remonte — sans avoir à
 * retourner en haut du document.
 *
 * Il ne s'installe pas pour autant : une seconde après être apparu, il se
 * retire de nouveau, sauf si on s'en sert (survol, appui, champ de recherche
 * actif, menu ouvert). Revenu en haut de page, il reprend sa place dans le flux
 * et n'est plus masqué.
 *
 * Le positionnement est `sticky`, pas `fixed` : l'en-tête garde sa place dans
 * le flux, donc aucun décalage de mise en page au moment où il s'accroche, et
 * aucune cale à maintenir sous lui.
 */
export function AutoHideHeader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let last = window.scrollY
    let ticking = false
    let engaged = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const clearTimer = () => {
      if (timer) clearTimeout(timer)
      timer = null
    }

    /** L'en-tête est-il en cours d'utilisation ? */
    const inUse = () =>
      engaged ||
      el.contains(document.activeElement) ||
      // Menu mobile ou boîte de dialogue ouverts : le défilement du fond est
      // verrouillé. Masquer l'en-tête reviendrait à masquer le menu qu'il
      // contient — on le laisse en place.
      document.body.style.overflow === 'hidden'

    const hide = () => {
      clearTimer()
      el.dataset.hidden = 'true'
    }

    const scheduleHide = () => {
      clearTimer()
      // En haut de page, l'en-tête est à sa place naturelle : rien à masquer.
      if (window.scrollY <= el.offsetHeight) return
      timer = setTimeout(() => {
        timer = null
        if (inUse()) return
        hide()
      }, AUTO_HIDE_MS)
    }

    const reveal = () => {
      el.dataset.hidden = 'false'
      scheduleHide()
    }

    const update = () => {
      ticking = false
      const y = Math.max(0, window.scrollY)
      const height = el.offsetHeight

      // Rebond élastique iOS en bas de page : le défilement « remonte » sans
      // que l'utilisateur ait remonté. On ignore cette zone.
      const bottom = document.documentElement.scrollHeight - window.innerHeight
      if (bottom > 0 && y >= bottom - 1) return

      const delta = y - last
      if (Math.abs(delta) < THRESHOLD) return
      last = y

      el.dataset.stuck = y > height ? 'true' : 'false'

      if (y <= height) {
        clearTimer()
        el.dataset.hidden = 'false'
      } else if (delta > 0) {
        hide()
      } else {
        reveal()
      }
    }

    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(update)
    }

    // Utiliser l'en-tête suspend le retrait ; le quitter le relance.
    const onEnter = () => {
      engaged = true
      clearTimer()
    }
    const onLeave = () => {
      engaged = false
      scheduleHide()
    }
    const onFocusOut = (e: FocusEvent) => {
      if (el.contains(e.relatedTarget as Node | null)) return
      engaged = false
      scheduleHide()
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerenter', onEnter)
    el.addEventListener('pointerdown', onEnter)
    el.addEventListener('focusin', onEnter)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('focusout', onFocusOut)

    return () => {
      clearTimer()
      window.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerenter', onEnter)
      el.removeEventListener('pointerdown', onEnter)
      el.removeEventListener('focusin', onEnter)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('focusout', onFocusOut)
    }
  }, [])

  return (
    <header
      ref={ref}
      data-hidden="false"
      data-stuck="false"
      className="sticky top-0 z-40 bg-white transition-[transform,box-shadow] duration-300 ease-out data-[hidden=true]:-translate-y-full data-[stuck=true]:shadow-card"
    >
      {children}
    </header>
  )
}
