import { ServicesManager } from '@/components/admin/services-manager'
import { WorkshopGalleryManager } from '@/components/admin/workshop-gallery-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Service, WorkshopPhotoWithService } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminServicesPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const [servicesRes, galleryRes] = await Promise.all([
    supabase.from('services').select('*').order('position').order('title'),
    supabase
      .from('workshop_gallery')
      .select('*, service:services(id,title,slug)')
      .order('position')
      .order('created_at'),
  ])

  const services = (servicesRes.data as Service[]) ?? []

  return (
    <>
      <PageHeader
        title="Mécanique"
        description="Galerie de l’atelier et prestations présentées sur la page /mecanique."
      />
      <div className="space-y-5">
        <WorkshopGalleryManager
          photos={(galleryRes.data as WorkshopPhotoWithService[]) ?? []}
          services={services}
        />
        <ServicesManager services={services} />
      </div>
    </>
  )
}
