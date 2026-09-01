import type { Metadata } from 'next'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: { default: 'Back-office', template: '%s | Back-office SR Faso' },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const profile = await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const [orders, messages] = await Promise.all([
    supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'nouvelle'),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'nouveau'),
  ])

  return (
    <AdminShell
      fullName={profile.full_name ?? profile.email}
      email={profile.email}
      badges={{ orders: orders.count ?? 0, messages: messages.count ?? 0 }}
    >
      {children}
    </AdminShell>
  )
}
