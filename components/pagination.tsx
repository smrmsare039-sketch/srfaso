import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '@/lib/utils'

export function Pagination({
  page,
  pages,
  basePath,
  searchParams,
}: {
  page: number
  pages: number
  basePath: string
  searchParams: Record<string, string | undefined>
}) {
  if (pages <= 1) return null

  const href = (target: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== 'page') params.set(key, value)
    }
    if (target > 1) params.set('page', String(target))
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const numbers: number[] = []
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  for (let i = start; i <= Math.min(pages, start + 4); i++) numbers.push(i)

  const cell =
    'grid h-11 min-w-11 place-items-center rounded-xl border px-3 text-sm font-semibold transition-colors'

  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cx(cell, 'border-ink-200 hover:border-ink-900')} aria-label="Page précédente">
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span className={cx(cell, 'border-ink-100 text-ink-300')}>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {start > 1 && (
        <>
          <Link href={href(1)} className={cx(cell, 'border-ink-200 hover:border-ink-900')}>
            1
          </Link>
          <span className="px-1 text-ink-300">…</span>
        </>
      )}

      {numbers.map((n) => (
        <Link
          key={n}
          href={href(n)}
          aria-current={n === page ? 'page' : undefined}
          className={cx(
            cell,
            n === page
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-ink-200 hover:border-ink-900'
          )}
        >
          {n}
        </Link>
      ))}

      {start + 4 < pages && (
        <>
          <span className="px-1 text-ink-300">…</span>
          <Link href={href(pages)} className={cx(cell, 'border-ink-200 hover:border-ink-900')}>
            {pages}
          </Link>
        </>
      )}

      {page < pages ? (
        <Link href={href(page + 1)} className={cx(cell, 'border-ink-200 hover:border-ink-900')} aria-label="Page suivante">
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span className={cx(cell, 'border-ink-100 text-ink-300')}>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
