'use client'

import { useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * Compte une vue produit (fonction `increment_product_views`, ouverte à anon).
 *
 * L'appel est fait dans le navigateur : la fiche produit est mise en cache
 * côté serveur, un comptage au rendu ne verrait qu'une visite sur 300 s.
 * Une vue par produit et par session, pour ne pas gonfler le compteur à chaque
 * aller-retour dans le catalogue.
 */
export function ProductViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `vue-produit:${slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // navigation privée : on compte quand même la vue
    }

    const supabase = createSupabaseBrowserClient()
    void supabase.rpc('increment_product_views', { product_slug: slug })
  }, [slug])

  return null
}
