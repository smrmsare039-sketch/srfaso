import { DeliveryForm } from '@/components/admin/delivery-form'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { DeliveryContent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminDeliveryPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('delivery_content').select('*').eq('id', 1).maybeSingle()

  return (
    <>
      <PageHeader
        title="Livraison & Retour"
        description="Contenu éditorial de la page publique /livraison-retour."
      />
      <DeliveryForm content={(data as DeliveryContent) ?? null} />
    </>
  )
}
