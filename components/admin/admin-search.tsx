'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

export function AdminSearch({ placeholder = 'Rechercher…' }: { placeholder?: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [term, setTerm] = useState(params.get('q') ?? '')

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString())
      if (term.trim()) next.set('q', term.trim())
      else next.delete('q')
      next.delete('page')
      const qs = next.toString()
      const target = qs ? `${pathname}?${qs}` : pathname
      if (target !== `${pathname}${params.toString() ? `?${params}` : ''}`) {
        router.replace(target, { scroll: false })
      }
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term])

  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-400" />
      <input
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-ink-200 bg-white pr-3.5 pl-10 text-sm outline-none focus:border-brand-500"
      />
    </div>
  )
}

export function AdminFilterSelect({
  name,
  options,
  allLabel,
}: {
  name: string
  options: { value: string; label: string }[]
  allLabel: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  return (
    <select
      value={params.get(name) ?? ''}
      onChange={(e) => {
        const next = new URLSearchParams(params.toString())
        if (e.target.value) next.set(name, e.target.value)
        else next.delete(name)
        next.delete('page')
        const qs = next.toString()
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      }}
      className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm outline-none focus:border-brand-500"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}
