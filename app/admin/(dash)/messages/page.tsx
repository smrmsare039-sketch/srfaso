import { Suspense } from 'react'
import { Mail, Phone } from 'lucide-react'
import { AdminFilterSelect, AdminSearch } from '@/components/admin/admin-search'
import { MessageActions } from '@/components/admin/message-actions'
import { Badge, Card, EmptyState, PageHeader } from '@/components/admin/ui'
import { Pagination } from '@/components/pagination'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { MESSAGE_STATUS_LABELS, type ContactMessage, type MessageStatus } from '@/lib/types'
import { formatDateTime, formatNumber, telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export const dynamic = 'force-dynamic'

const PER_PAGE = 20

const TONES: Record<MessageStatus, 'brand' | 'info' | 'success'> = {
  nouveau: 'brand',
  lu: 'info',
  traite: 'success',
}

export default async function AdminMessagesPage(props: PageProps<'/admin/messages'>) {
  await requireAdmin()
  const sp = await props.searchParams
  const get = (key: string) => {
    const v = sp[key]
    return Array.isArray(v) ? v[0] : v
  }

  const supabase = await createSupabaseServerClient()
  const page = Math.max(1, Number(get('page') ?? 1) || 1)
  const search = get('q')?.trim()
  const status = get('statut')

  let query = supabase.from('contact_messages').select('*', { count: 'exact' })
  if (status) query = query.eq('status', status)
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,subject.ilike.%${search}%`)
  }

  const from = (page - 1) * PER_PAGE
  const { data, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + PER_PAGE - 1)

  const messages = (data as ContactMessage[] | null) ?? []
  const total = count ?? messages.length
  const pages = Math.max(1, Math.ceil(total / PER_PAGE))

  const plainParams: Record<string, string | undefined> = {}
  for (const [key, value] of Object.entries(sp)) {
    plainParams[key] = Array.isArray(value) ? value[0] : value
  }

  return (
    <>
      <PageHeader
        title="Messages"
        description={`${formatNumber(total)} demande${total > 1 ? 's' : ''} reçue${total > 1 ? 's' : ''} via le formulaire de contact.`}
      />

      <Card className="mb-4">
        <Suspense fallback={<div className="h-11" />}>
          <div className="flex flex-wrap gap-3">
            <AdminSearch placeholder="Nom, téléphone ou sujet…" />
            <AdminFilterSelect
              name="statut"
              allLabel="Tous les statuts"
              options={Object.entries(MESSAGE_STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </div>
        </Suspense>
      </Card>

      {messages.length === 0 ? (
        <EmptyState title="Aucun message." />
      ) : (
        <ul className="space-y-3">
          {messages.map((message) => (
            <li key={message.id} className="rounded-2xl border border-ink-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="font-bold text-ink-900">{message.name}</h3>
                    <Badge tone={TONES[message.status]}>
                      {MESSAGE_STATUS_LABELS[message.status]}
                    </Badge>
                  </div>
                  {message.subject && (
                    <p className="mt-1 text-sm font-semibold text-ink-700">{message.subject}</p>
                  )}
                </div>
                <span className="text-xs text-ink-400">{formatDateTime(message.created_at)}</span>
              </div>

              <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-ink-600">
                {message.message}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-ink-50 pt-4">
                <a
                  href={telLink(message.phone)}
                  className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-900"
                >
                  <Phone className="size-4" />
                  {message.phone}
                </a>
                <a
                  href={whatsappLink(message.phone, `Bonjour ${message.name}, `)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-semibold text-[#25D366]"
                >
                  <WhatsAppIcon className="size-4" />
                  WhatsApp
                </a>
                {message.email && (
                  <a
                    href={`mailto:${message.email}`}
                    className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-brand-900"
                  >
                    <Mail className="size-4" />
                    {message.email}
                  </a>
                )}
                <div className="ml-auto">
                  <MessageActions id={message.id} status={message.status} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pages={pages} basePath="/admin/messages" searchParams={plainParams} />
    </>
  )
}
