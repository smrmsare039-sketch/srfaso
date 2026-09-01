'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { value: 'pertinence', label: 'Pertinence' },
  { value: 'nouveautes', label: 'Nouveautés' },
  { value: 'prix-asc', label: 'Prix croissant' },
  { value: 'prix-desc', label: 'Prix décroissant' },
  { value: 'populaires', label: 'Produits populaires' },
]

export function SortSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <label className="flex items-center gap-2 text-sm text-ink-500">
      <span className="hidden sm:inline">Trier par</span>
      <select
        value={params.get('tri') ?? 'pertinence'}
        onChange={(e) => {
          const next = new URLSearchParams(params.toString())
          if (e.target.value === 'pertinence') next.delete('tri')
          else next.set('tri', e.target.value)
          next.delete('page')
          router.push(`${pathname}?${next.toString()}`, { scroll: false })
        }}
        className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-900 outline-none focus:border-brand-500"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
