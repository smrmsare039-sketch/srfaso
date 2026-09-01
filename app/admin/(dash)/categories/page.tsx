import { CategoriesManager } from '@/components/admin/categories-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminCategoriesPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('position').order('name'),
    supabase.from('products').select('category_id').limit(10000),
  ])

  const counts: Record<string, number> = {}
  for (const row of (products as { category_id: string | null }[] | null) ?? []) {
    if (row.category_id) counts[row.category_id] = (counts[row.category_id] ?? 0) + 1
  }

  return (
    <>
      <PageHeader
        title="Catégories"
        description="Organisez le catalogue, l’ordre du menu latéral et le SEO de chaque famille de pièces."
      />
      <CategoriesManager categories={(categories as Category[]) ?? []} counts={counts} />
    </>
  )
}
