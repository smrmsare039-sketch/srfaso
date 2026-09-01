import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeading({
  eyebrow,
  title,
  href,
  linkLabel = 'Tout voir',
}: {
  eyebrow?: string
  title: string
  href?: string
  linkLabel?: string
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-extrabold text-ink-900 sm:text-[1.75rem]">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-600 transition-colors hover:text-brand-600 sm:flex"
        >
          {linkLabel}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}
