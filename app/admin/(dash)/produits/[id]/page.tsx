import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'
import { ProductImagesManager } from '@/components/admin/product-images-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Category, ProductWithRelations } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EditProductPage(props: PageProps<'/admin/produits/[id]'>) {
  await requireAdmin()
  const { id } = await props.params
  const supabase = await createSupabaseServerClient()

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select(
        '*, category:categories!products_category_id_fkey(id,name,slug), images:product_images(*)'
      )
      .eq('id', id)
      .maybeSingle(),
    supabase.from('categories').select('*').order('position'),
  ])

  if (!product) notFound()

  const typed = product as ProductWithRelations
  const images = [...(typed.images ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
  )

  return (
    <>
      <PageHeader
        title={typed.name}
        description="Modifiez la fiche produit, ses images et ses métadonnées SEO."
        action={
          <div className="flex gap-2">
            <Link
              href={`/produits/${typed.slug}`}
              target="_blank"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-ink-400"
            >
              <ExternalLink className="size-4" />
              Voir
            </Link>
            <Link
              href="/admin/produits"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-ink-400"
            >
              <ArrowLeft className="size-4" />
              Retour
            </Link>
          </div>
        }
      />

      <div className="mb-5">
        <ProductImagesManager
          productId={typed.id}
          productName={typed.name}
          images={images}
        />
      </div>

      <ProductForm product={typed} categories={(categories as Category[]) ?? []} />
    </>
  )
}
