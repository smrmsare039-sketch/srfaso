import { Suspense } from 'react'
import { AdminSearch } from '@/components/admin/admin-search'
import { Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { Pagination } from '@/components/pagination'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Customer } from '@/lib/types'
import { formatDate, formatNumber, formatPrice, telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const dynamic = 'force-dynamic'

const PER_PAGE = 25

export default async function AdminCustomersPage(props: PageProps<'/admin/clients'>) {
  await requireAdmin()
  const sp = await props.searchParams
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const supabase = await createSupabaseServerClient()
  const page = Math.max(1, Number(get('page') ?? 1) || 1)
  const search = get('q')?.trim()

  let query = supabase.from('customers').select('*', { count: 'exact' })
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,phone.ilike.%${search}%,city.ilike.%${search}%`
    )
  }

  const from = (page - 1) * PER_PAGE
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  const customers = (data as Customer[] | null) ?? []
  const total = count ?? customers.length
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <>
      <PageHeader
        title="Clients"
        description={`${formatNumber(total)} client${total > 1 ? 's' : ''} enregistré${total > 1 ? 's' : ''} à partir des commandes.`}
      />

      <Card className="mb-4">
        <Suspense fallback={<div className="h-11" />}>
          <AdminSearch placeholder="Nom, téléphone ou ville…" />
        </Suspense>
      </Card>

      {customers.length === 0 ? (
        <EmptyState title="Aucun client pour le moment." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-ink-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[44rem] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs tracking-wider text-ink-500 uppercase">
                  <th className="px-4 py-3 font-semibold">Client</th>
                  <th className="px-4 py-3 font-semibold">Téléphone</th>
                  <th className="px-4 py-3 font-semibold">Ville</th>
                  <th className="px-4 py-3 text-center font-semibold">Commandes</th>
                  <th className="px-4 py-3 text-right font-semibold">Total dépensé</th>
                  <th className="px-4 py-3 font-semibold">Depuis</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-3">
                      <span className="block font-semibold text-ink-900">
                        {customer.full_name ?? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`}
                      </span>
                      {customer.email && (
                        <span className="block text-xs text-ink-400">{customer.email}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <a href={telLink(customer.phone)} className="text-ink-700 hover:text-brand-900">
                          {customer.phone}
                        </a>
                        <a
                          href={whatsappLink(customer.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp"
                          className="text-[#25D366]"
                        >
                          <WhatsAppIcon className="size-4" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-600">
                      {customer.city ?? '—'}
                      {customer.district && (
                        <span className="block text-xs text-ink-400">{customer.district}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-ink-800">
                      {customer.orders_count}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-ink-900">
                      {formatPrice(customer.total_spent)}
                    </td>
                    <td className="px-4 py-3 text-ink-500">{formatDate(customer.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/clients" searchParams={plainParams} />
    </>
  )
}
