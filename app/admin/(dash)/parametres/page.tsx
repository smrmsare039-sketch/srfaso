import { SettingsForm } from '@/components/admin/settings-form'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { DEFAULT_SETTINGS } from '@/lib/data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SiteSettings } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.from('site_settings').select('*').eq('id', 1).maybeSingle()

  const settings: SiteSettings = data
    ? { ...DEFAULT_SETTINGS, ...(data as SiteSettings) }
    : DEFAULT_SETTINGS

  return (
    <>
      <PageHeader
        title="Paramètres généraux"
        description="Identité, coordonnées, réseaux sociaux, page d’accueil et référencement du site."
      />
      <SettingsForm settings={settings} />
    </>
  )
}
