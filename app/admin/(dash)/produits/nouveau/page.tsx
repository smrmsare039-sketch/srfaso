import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProductForm } from '@/components/admin/product-form'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function NewProductPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('categories').select('*').order('position')

  return (
    <>
      <PageHeader
        title="Nouveau produit"
        description="Créez une fiche produit complète et optimisée pour le référencement."
        action={
          <Link
            href="/admin/produits"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-700 hover:border-ink-400"
          >
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        }
      />
      <ProductForm categories={(data as Category[]) ?? []} />
      <p className="mt-5 text-sm text-ink-500">
        Les images pourront être ajoutées après la création du produit.
      </p>
    </>
  )
}
