import { PromoForm, type PromoProductOption } from '@/components/admin/promo-form'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { HomePromo } from '@/lib/types'

export const dynamic = 'force-dynamic'

type ProductRow = {
  id: string
  name: string
  price: number
  old_price: number | null
  images: { url: string; position: number; is_primary: boolean }[] | null
}

export default async function AdminPromoPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const [promoResult, productsResult] = await Promise.all([
    supabase.from('home_promo').select('*').eq('id', 1).maybeSingle(),
    supabase
      .from('products')
      .select('id,name,price,old_price,images:product_images(url,position,is_primary)')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .limit(500),
  ])

  const promoRow = promoResult.data as HomePromo | null
  const promo = promoRow
    ? {
        ...promoRow,
        product_ids: Array.isArray(promoRow.product_ids)
          ? promoRow.product_ids.filter((id): id is string => typeof id === 'string')
          : [],
      }
    : null

  const products: PromoProductOption[] = ((productsResult.data as ProductRow[] | null) ?? []).map(
    (p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      old_price: p.old_price != null ? Number(p.old_price) : null,
      image_url:
        [...(p.images ?? [])].sort(
          (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
        )[0]?.url ?? null,
    })
  )

  return (
    <>
      <PageHeader
        title="Section promotion"
        description="Bannière « offre du moment » affichée sur la page d’accueil, avant la sélection de la boutique."
      />
      <PromoForm promo={promo} products={products} />
    </>
  )
}
