import Link from 'next/link'
import { Suspense } from 'react'
import { AdminFilterSelect, AdminSearch } from '@/components/admin/admin-search'
import { OrderRowActions } from '@/components/admin/order-row-actions'
import { Badge, Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { Pagination } from '@/components/pagination'
import { requireAdmin } from '@/lib/auth'
import { getSettings } from '@/lib/data'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderStatus } from '@/lib/types'
import { formatDateTime, formatNumber, formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

export default async function AdminOrdersPage(props: PageProps<'/admin/commandes'>) {
  await requireAdmin()
  const sp = await props.searchParams
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const supabase = await createSupabaseServerClient()
  const settings = await getSettings()
  const page = Math.max(1, Number(get('page') ?? 1) || 1)
  const search = get('q')?.trim()
  const status = get('statut')

  let query = supabase.from('orders').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(
      `reference.ilike.%${search}%,phone.ilike.%${search}%,last_name.ilike.%${search}%,first_name.ilike.%${search}%`
    )
  }

  const from = (page - 1) * PER_PAGE
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  const orders = data ?? []
  const total = count ?? orders.length
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <>
      <PageHeader
        title="Commandes"
        description={`${formatNumber(total)} commande${total > 1 ? 's' : ''}.`}
      />

      <Card className="mb-4">
        <Suspense fallback={<div className="h-11" />}>
          <div className="flex flex-wrap gap-3">
            <AdminSearch placeholder="N°, nom ou téléphone…" />
            <AdminFilterSelect
              name="statut"
              allLabel="Tous les statuts"
              options={Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
        </Suspense>
      </Card>

      {orders.length === 0 ? (
        <EmptyState title="Aucune commande." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs tracking-wider text-ink-500 uppercase">
                  <th className="px-4 py-3 font-semibold">N°</th>
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Téléphone</th>
                  <th className="px-4 py-3 font-semibold">Ville</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  <th className="px-4 py-3 font-semibold">Statut</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/commandes/${order.id}`}
                        className="font-semibold text-brand-800 hover:underline"
                      >
                        {order.reference}
                      </Link>
                      <span className="block text-xs text-ink-400">
                        {formatDateTime(order.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-ink-800">
                      {order.first_name} {order.last_name}
                    </td>
                    <td className="px-4 py-3 text-ink-600">{order.phone}</td>
                    <td className="px-4 py-3 text-ink-600">
                      {order.city}
                      {order.district && (
                        <span className="block text-xs text-ink-400">{order.district}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {formatPrice(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={ORDER_STATUS_TONES[order.status as OrderStatus]}>
                        {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <OrderRowActions
                        order={{ ...order, status: order.status as OrderStatus }}
                        companyName={settings.company_name}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination
        page={page}
        pages={pages}
        basePath="/admin/commandes"
        searchParams={plainParams}
      />
    </>
  )
}
