import { BrandsManager } from '@/components/admin/brands-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { DEFAULT_SETTINGS } from '@/lib/data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { PartnerBrand, SiteSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminBrandsPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const [brandsRes, settingsRes] = await Promise.all([
    supabase.from('partner_brands').select('*').order('position').order('name'),
    supabase.from('site_settings').select('*').eq('id', 1).maybeSingle(),
  ])

  const settings: SiteSettings = { ...DEFAULT_SETTINGS, ...(settingsRes.data ?? {}) }

  return (
    <>
      <PageHeader
        title="Marques partenaires"
        description="Logos et texte de la section « Nos marques partenaires » de la page d’accueil."
      />
      <BrandsManager brands={(brandsRes.data as PartnerBrand[]) ?? []} settings={settings} />
    </>
  )
}
