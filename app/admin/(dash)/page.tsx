import Link from 'next/link'
import { ArrowRight, MessageSquare, PackageX, ShoppingCart } from 'lucide-react'
import { BarList, Delta, DonutChart, TrendChart } from '@/components/admin/charts'
import { Badge, Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, type OrderStatus } from '@/lib/types'
import { cx, formatDateTime, formatNumber, formatPrice } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const PERIOD_DAYS = 30
const DAY_MS = 86_400_000

/** Variation en % entre deux périodes ; null quand la précédente est vide. */
function delta(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** Début de la période courante (minuit) et de la période de comparaison. */
function periodBounds() {
  const periodStart = new Date(Date.now() - (PERIOD_DAYS - 1) * DAY_MS).setHours(0, 0, 0, 0)
  return { periodStart, previousStart: periodStart - PERIOD_DAYS * DAY_MS }
}

type OrderRow = {
  total: number | string | null
  status: string
  city: string | null
  created_at: string
}

function sumTotals(orders: OrderRow[]): number {
  return orders.reduce((sum, o) => sum + Number(o.total ?? 0), 0)
}

/** Somme par jour sur la période, jours sans commande inclus (sinon la courbe ment). */
function dailySeries(orders: OrderRow[], start: number, days: number) {
  const revenue = new Array<number>(days).fill(0)
  const count = new Array<number>(days).fill(0)

  for (const order of orders) {
    const index = Math.floor((new Date(order.created_at).getTime() - start) / DAY_MS)
    if (index < 0 || index >= days) continue
    revenue[index] += Number(order.total ?? 0)
    count[index] += 1
  }

  const labels = Array.from({ length: days }, (_, i) =>
    new Date(start + i * DAY_MS).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  )

  return {
    revenue: labels.map((label, i) => ({ label, value: revenue[i] })),
    count: labels.map((label, i) => ({ label, value: count[i] })),
  }
}

/** Top N d'un regroupement, le reste replié dans « Autres ». */
function topGroups(entries: Map<string, number>, limit: number) {
  const sorted = [...entries.entries()].sort((a, b) => b[1] - a[1])
  const top = sorted.slice(0, limit).map(([label, value]) => ({ label, value }))
  const rest = sorted.slice(limit).reduce((sum, [, value]) => sum + value, 0)
  if (rest > 0) top.push({ label: 'Autres', value: rest })
  return top
}

export default async function AdminDashboard() {
  const profile = await requireAdmin()
  const supabase = await createSupabaseServerClient()

  const { periodStart, previousStart } = periodBounds()

  const [
    productsTotal,
    productsOut,
    categoriesTotal,
    ordersTotal,
    ordersNew,
    customersTotal,
    newCustomers,
    messagesNew,
    recentOrders,
    topProducts,
    windowOrders,
  ] = await Promise.all([
    supabase.from('products').select('id', { count: 'exact', head: true }),
    supabase.from('products').select('id', { count: 'exact', head: true }).lte('stock', 0),
    supabase.from('categories').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }),
    supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'nouvelle'),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', new Date(periodStart).toISOString()),
    supabase
      .from('contact_messages')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'nouveau'),
    supabase
      .from('orders')
      .select('id,reference,first_name,last_name,city,total,status,created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('products')
      .select('id,name,slug,views,sales_count,stock')
      .order('views', { ascending: false })
      .order('sales_count', { ascending: false })
      .limit(6),
    // Deux périodes d'un coup : la courante et la précédente pour la comparaison.
    supabase
      .from('orders')
      .select('total,status,city,created_at')
      .gte('created_at', new Date(previousStart).toISOString())
      .limit(5000),
  ])

  const orders = (windowOrders.data ?? []) as OrderRow[]
  const current = orders.filter((o) => new Date(o.created_at).getTime() >= periodStart)
  const previous = orders.filter((o) => new Date(o.created_at).getTime() < periodStart)

  const revenue = sumTotals(current)
  const previousRevenue = sumTotals(previous)
  const basket = current.length ? revenue / current.length : 0
  const previousBasket = previous.length ? previousRevenue / previous.length : 0

  const series = dailySeries(current, periodStart, PERIOD_DAYS)

  const byStatus = new Map<string, number>()
  const byCity = new Map<string, number>()
  for (const order of current) {
    byStatus.set(order.status, (byStatus.get(order.status) ?? 0) + 1)
    const city = order.city?.trim() || 'Non précisée'
    byCity.set(city, (byCity.get(city) ?? 0) + Number(order.total ?? 0))
  }

  const statusSlices = [...byStatus.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([status, value]) => ({
      label: ORDER_STATUS_LABELS[status as OrderStatus] ?? status,
      value,
    }))

  const cityBars = topGroups(byCity, 5)

  const kpis = [
    {
      label: 'Chiffre d’affaires',
      value: formatPrice(revenue),
      trend: delta(revenue, previousRevenue),
      hint: `${formatNumber(current.length)} commandes sur ${PERIOD_DAYS} jours`,
      href: '/admin/commandes',
    },
    {
      label: 'Commandes',
      value: formatNumber(current.length),
      trend: delta(current.length, previous.length),
      hint: `${formatNumber(ordersTotal.count ?? 0)} depuis l’ouverture`,
      href: '/admin/commandes',
    },
    {
      label: 'Panier moyen',
      value: formatPrice(Math.round(basket)),
      trend: delta(basket, previousBasket),
      hint: 'Montant moyen par commande',
      href: '/admin/commandes',
    },
    {
      label: 'Nouveaux clients',
      value: formatNumber(newCustomers.count ?? 0),
      trend: null,
      hint: `${formatNumber(customersTotal.count ?? 0)} clients enregistrés`,
      href: '/admin/clients',
    },
  ]

  const alerts = [
    {
      icon: ShoppingCart,
      label: 'Commandes à traiter',
      value: ordersNew.count ?? 0,
      href: '/admin/commandes?statut=nouvelle',
      tone: (ordersNew.count ?? 0) > 0 ? 'brand' : 'muted',
    },
    {
      icon: PackageX,
      label: 'Produits en rupture',
      value: productsOut.count ?? 0,
      href: '/admin/produits?stock=rupture',
      tone: (productsOut.count ?? 0) > 0 ? 'warning' : 'muted',
    },
    {
      icon: MessageSquare,
      label: 'Messages non lus',
      value: messagesNew.count ?? 0,
      href: '/admin/messages',
      tone: (messagesNew.count ?? 0) > 0 ? 'brand' : 'muted',
    },
  ] as const

  return (
    <>
      <PageHeader
        title={`Bonjour ${(profile.full_name ?? profile.email).split(' ')[0]}`}
        description={`Activité des ${PERIOD_DAYS} derniers jours, comparée aux ${PERIOD_DAYS} jours précédents.`}
      />

      {/* Indicateurs clés */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className="rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-ink-300"
          >
            <p className="text-sm font-medium text-ink-500">{kpi.label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink-900">{kpi.value}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Delta value={kpi.trend} />
            </div>
            <p className="mt-1 text-xs text-ink-400">{kpi.hint}</p>
          </Link>
        ))}
      </div>

      {/* Alertes actionnables */}
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {alerts.map((alert) => (
          <Link
            key={alert.label}
            href={alert.href}
            className="flex items-center gap-4 rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-ink-300"
          >
            <span
              className={cx(
                'grid size-11 shrink-0 place-items-center rounded-xl',
                alert.tone === 'brand'
                  ? 'bg-brand-50 text-brand-600'
                  : alert.tone === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-ink-50 text-ink-400'
              )}
            >
              <alert.icon className="size-5" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block font-display text-2xl font-extrabold text-ink-900">
                {formatNumber(alert.value)}
              </span>
              <span className="block text-sm text-ink-500">{alert.label}</span>
            </span>
          </Link>
        ))}
      </div>

      {/* Courbes */}
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <Card
          title="Chiffre d’affaires par jour"
          description={`${formatPrice(revenue)} sur ${PERIOD_DAYS} jours`}
        >
          <TrendChart points={series.revenue} format="compact-price" />
        </Card>
        <Card
          title="Commandes par jour"
          description={`${formatNumber(current.length)} commandes sur ${PERIOD_DAYS} jours`}
        >
          <TrendChart
            points={series.count}
            color="#2a78d6"
            format="number"
          />
        </Card>
      </div>

      {/* Répartitions */}
      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card title="Commandes par statut" description="Où en est le traitement">
          <DonutChart slices={statusSlices} format="number" centerLabel="commandes" />
        </Card>
        <Card title="Chiffre d’affaires par ville" description="Top 5 sur la période">
          <BarList bars={cityBars} format="price" />
        </Card>
      </div>

      {/* Détail */}
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card title="Dernières commandes">
          {(recentOrders.data ?? []).length === 0 ? (
            <EmptyState title="Aucune commande pour le moment." />
          ) : (
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs tracking-wider whitespace-nowrap text-ink-400 uppercase">
                    <th className="px-5 py-2.5 font-semibold">N°</th>
                    <th className="px-5 py-2.5 font-semibold">Client</th>
                    <th className="px-5 py-2.5 font-semibold">Ville</th>
                    <th className="px-5 py-2.5 text-right font-semibold">Montant</th>
                    <th className="px-5 py-2.5 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders.data ?? []).map((order) => (
                    <tr key={order.id} className="border-b border-ink-50 last:border-0">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Link
                          href={`/admin/commandes/${order.id}`}
                          className="font-semibold text-brand-600 hover:underline"
                        >
                          {order.reference}
                        </Link>
                        <span className="block text-xs text-ink-400">
                          {formatDateTime(order.created_at)}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-ink-800">
                        {order.first_name} {order.last_name}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap text-ink-500">{order.city}</td>
                      <td className="px-5 py-3 text-right font-semibold whitespace-nowrap text-ink-900">
                        {formatPrice(order.total)}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <Badge tone={ORDER_STATUS_TONES[order.status as OrderStatus]}>
                          {ORDER_STATUS_LABELS[order.status as OrderStatus]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Link
            href="/admin/commandes"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            Toutes les commandes <ArrowRight className="size-4" />
          </Link>
        </Card>

        <Card title="Produits les plus consultés" description="Vues cumulées sur les fiches">
          {(topProducts.data ?? []).length === 0 ? (
            <EmptyState title="Aucun produit." />
          ) : (
            <BarList
              bars={(topProducts.data ?? []).map((p) => ({
                label: p.name,
                value: Number(p.views ?? 0),
                hint: `${formatNumber(p.sales_count)} vendus${p.stock <= 0 ? ' · en rupture' : ''}`,
              }))}
              format="number"
              suffix=" vues"
              color="#1baf7a"
            />
          )}
          <Link
            href="/admin/produits"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline"
          >
            Tous les produits <ArrowRight className="size-4" />
          </Link>
        </Card>
      </div>

      <p className="mt-6 text-xs text-ink-400">
        {formatNumber(productsTotal.count ?? 0)} produits ·{' '}
        {formatNumber(categoriesTotal.count ?? 0)} catégories
      </p>
    </>
  )
}
