import { ShopsManager } from '@/components/admin/shops-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Shop } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminShopsPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('shops').select('*').order('position').order('name')

  return (
    <>
      <PageHeader
        title="Boutiques"
        description="Points de vente affichés sur la page /boutiques et dans les données structurées locales."
      />
      <ShopsManager shops={(data as Shop[]) ?? []} />
    </>
  )
}
