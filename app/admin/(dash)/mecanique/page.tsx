import { ServicesManager } from '@/components/admin/services-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Service } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('services').select('*').order('position').order('title')

  return (
    <>
      <PageHeader
        title="Mécanique"
        description="Prestations d’atelier présentées sur la page /mecanique."
      />
      <ServicesManager services={(data as Service[]) ?? []} />
    </>
  )
}
