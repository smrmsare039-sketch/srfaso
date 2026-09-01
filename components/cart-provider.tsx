'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '@/components/toast'
import type { CartLine } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

const STORAGE_KEY = 'srfaso.cart.v1'

type CartContextValue = {
  lines: CartLine[]
  ready: boolean
  count: number
  subtotal: number
  add: (line: Omit<CartLine, 'quantity'>, quantity?: number) => void
  remove: (productId: string) => void
  setQuantity: (productId: string, quantity: number) => void
  /** `silent` : vidage technique (commande validée), sans notification. */
  clear: (options?: { silent?: boolean }) => void
}

const CartContext = createContext<CartContextValue | null>(null)

function read(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is CartLine =>
        l && typeof l.productId === 'string' && typeof l.price === 'number' && l.quantity > 0
    )
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)
  const toast = useToast()

  // Les actions du panier notifient : elles ont besoin de l'état courant en
  // dehors du cycle de rendu, sans le capturer dans chaque callback.
  const linesRef = useRef<CartLine[]>([])
  useEffect(() => {
    linesRef.current = lines
  }, [lines])

  // Le panier avant la dernière action destructive, pour proposer « Annuler ».
  const previousRef = useRef<CartLine[]>([])

  // Le panier vit dans localStorage : il ne peut être lu qu'après
  // l'hydratation, sous peine de divergence serveur/client.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLines(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      // quota / navigation privée : le panier reste en mémoire
    }
  }, [lines, ready])

  const add = useCallback<CartContextValue['add']>(
    (line, quantity = 1) => {
      const amount = Math.max(1, quantity)
      const current = linesRef.current
      const existing = current.find((l) => l.productId === line.productId)
      const max = line.stock > 0 ? line.stock : 999
      const wanted = (existing?.quantity ?? 0) + amount
      const capped = wanted > max

      setLines(
        existing
          ? current.map((l) =>
              l.productId === line.productId
                ? { ...l, ...line, quantity: Math.min(max, wanted) }
                : l
            )
          : [...current, { ...line, quantity: amount }]
      )

      if (capped) {
        toast.warning('Stock maximum atteint', {
          key: `panier-${line.productId}`,
          description: `Il ne reste que ${line.stock} unité${line.stock > 1 ? 's' : ''} de « ${line.name} ». Le panier a été ajusté.`,
          image: line.image,
          actions: [{ label: 'Voir le panier', href: '/panier', tone: 'neutral' }],
        })
        return
      }

      toast.success('Ajouté au panier', {
        key: `panier-${line.productId}`,
        description: `${amount} × ${line.name} — ${formatPrice(line.price * amount)}`,
        image: line.image,
        actions: [
          { label: 'Commander', href: '/commande' },
          { label: 'Voir le panier', href: '/panier', tone: 'neutral' },
        ],
      })
    },
    [toast]
  )

  const undo = useCallback(() => {
    setLines(previousRef.current)
    toast.success('Panier restauré')
  }, [toast])

  const remove = useCallback(
    (productId: string) => {
      const current = linesRef.current
      const target = current.find((l) => l.productId === productId)
      if (!target) return

      previousRef.current = current
      setLines(current.filter((l) => l.productId !== productId))
      toast.info('Article retiré du panier', {
        key: 'panier-retrait',
        description: target.name,
        image: target.image,
        actions: [{ label: 'Annuler', tone: 'neutral', onClick: undo }],
      })
    },
    [toast, undo]
  )

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((current) =>
      quantity <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, quantity } : l))
    )
  }, [])

  const clear = useCallback<CartContextValue['clear']>(
    (options) => {
      const current = linesRef.current
      setLines([])
      if (options?.silent || current.length === 0) return

      previousRef.current = current
      const count = current.reduce((sum, l) => sum + l.quantity, 0)
      toast.info('Panier vidé', {
        key: 'panier-vide',
        description: `${count} article${count > 1 ? 's' : ''} retiré${count > 1 ? 's' : ''}.`,
        actions: [{ label: 'Annuler', tone: 'neutral', onClick: undo }],
      })
    },
    [toast, undo]
  )

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.quantity, 0)
    const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0)
    return { lines, ready, count, subtotal, add, remove, setQuantity, clear }
  }, [lines, ready, add, remove, setQuantity, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart doit être utilisé dans un CartProvider')
  return ctx
}
