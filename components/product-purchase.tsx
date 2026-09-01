'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, Minus, Plus, Share2, ShoppingCart } from 'lucide-react'
import { useCart } from '@/components/cart-provider'
import { useToast } from '@/components/toast'
import type { ProductWithRelations } from '@/lib/types'
import { cx, formatPrice, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function ProductPurchase({
  product,
  whatsapp,
  productUrl,
}: {
  product: ProductWithRelations
  whatsapp: string | null
  productUrl: string
}) {
  const { add } = useCart()
  const toast = useToast()
  const router = useRouter()
  const [quantity, setQuantity] = useState(1)
  const [shared, setShared] = useState(false)

  const inStock = product.stock > 0
  const max = inStock ? product.stock : 1
  const image = product.images?.[0]?.url ?? null

  const line = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: Number(product.price),
    image,
    stock: product.stock,
  }

  const waMessage = [
    'Bonjour SUPER & RESISTANT, je souhaite commander :',
    '',
    `${quantity} × ${product.name}${product.reference ? ` (réf. ${product.reference})` : ''}`,
    `Prix : ${formatPrice(Number(product.price) * quantity)}`,
    '',
    productUrl,
  ].join('\n')

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url: productUrl })
        return
      }
      await navigator.clipboard.writeText(productUrl)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
      toast.success('Lien copié', {
        key: 'partage',
        description: 'Le lien de la fiche produit est dans votre presse-papiers.',
      })
    } catch {
      // Partage annulé par l'utilisateur : rien à signaler. Sinon, on le dit.
      if (!navigator.share) {
        toast.error('Copie impossible', {
          key: 'partage',
          description: 'Votre navigateur a refusé l’accès au presse-papiers.',
        })
      }
    }
  }

  return (
    <div className="mt-7">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-ink-500">Quantité</span>
        <div className="flex h-12 items-center rounded-xl border border-ink-200">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Diminuer la quantité"
            className="grid h-full w-11 place-items-center text-ink-600 hover:text-brand-600"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-bold text-ink-900">{quantity}</span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            aria-label="Augmenter la quantité"
            className="grid h-full w-11 place-items-center text-ink-600 hover:text-brand-600"
          >
            <Plus className="size-4" />
          </button>
        </div>
        {inStock && product.stock <= 5 && (
          <span className="text-sm font-medium text-brand-600">
            Plus que {product.stock} en stock
          </span>
        )}
      </div>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <button
          type="button"
          disabled={!inStock}
          onClick={() => add(line, quantity)}
          className={cx(
            'flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold transition-colors',
            inStock
              ? 'border-2 border-ink-900 text-ink-900 hover:bg-ink-900 hover:text-white'
              : 'cursor-not-allowed bg-ink-100 text-ink-400'
          )}
        >
          <ShoppingCart className="size-5" aria-hidden />
          Ajouter au panier
        </button>

        <button
          type="button"
          disabled={!inStock}
          onClick={() => {
            add(line, quantity)
            router.push('/commande')
          }}
          className={cx(
            'flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-[15px] font-bold transition-colors',
            inStock
              ? 'bg-brand-600 text-white hover:bg-brand-700'
              : 'cursor-not-allowed bg-ink-100 text-ink-400'
          )}
        >
          Commander
        </button>
      </div>

      <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
        {whatsapp && (
          <a
            href={whatsappLink(whatsapp, waMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-5 py-3.5 text-[15px] font-bold whitespace-nowrap text-white transition-opacity hover:opacity-90"
          >
            Commander sur
            <WhatsAppIcon className="size-5" />
            <span className="sr-only">WhatsApp</span>
          </a>
        )}
        <button
          type="button"
          onClick={share}
          className="flex items-center justify-center gap-2 rounded-xl border border-ink-200 px-5 py-3.5 text-[15px] font-semibold text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900"
        >
          {shared ? <Check className="size-5 text-green-600" /> : <Share2 className="size-5" />}
          {shared ? 'Lien copié' : 'Partager'}
        </button>
      </div>
    </div>
  )
}
