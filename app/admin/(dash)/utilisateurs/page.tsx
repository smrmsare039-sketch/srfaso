import { UsersManager } from '@/components/admin/users-manager'
import { PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const profile = await requireAdmin()
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        description="Comptes autorisés à accéder au back-office de SR Faso."
      />
      <UsersManager users={(data as Profile[]) ?? []} currentUserId={profile.id} />
    </>
  )
}
