import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_URL } from '@/app/layout'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ label: 'Accueil', href: '/' }, ...items]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: all.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
    })),
  }

  return (
    <nav aria-label="Fil d'Ariane" className="py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ol className="flex flex-wrap items-center gap-1 text-[0.8125rem] text-ink-500">
        {all.map((crumb, i) => (
          <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 text-ink-300" aria-hidden />}
            {crumb.href && i < all.length - 1 ? (
              <Link href={crumb.href} className="transition-colors hover:text-brand-600">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-ink-900">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
