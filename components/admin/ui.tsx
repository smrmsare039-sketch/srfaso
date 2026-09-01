import Link from 'next/link'
import type { ReactNode } from 'react'
import { cx } from '@/lib/utils'

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 className="text-2xl font-extrabold text-ink-900">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({
  children,
  className,
  title,
  description,
}: {
  children: ReactNode
  className?: string
  title?: string
  description?: string
}) {
  return (
    <section className={cx('rounded-2xl border border-ink-200 bg-white', className)}>
      {(title || description) && (
        <header className="border-b border-ink-100 px-5 py-4">
          {title && <h3 className="font-bold text-ink-900">{title}</h3>}
          {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function StatCard({
  label,
  value,
  hint,
  href,
  tone = 'default',
}: {
  label: string
  value: string | number
  hint?: string
  href?: string
  tone?: 'default' | 'brand' | 'warning' | 'success'
}) {
  const tones = {
    default: 'text-ink-900',
    brand: 'text-brand-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
  }

  const content = (
    <>
      <p className="text-sm font-medium text-ink-500">{label}</p>
      <p className={cx('mt-2 font-display text-3xl font-extrabold', tones[tone])}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </>
  )

  const className =
    'block rounded-2xl border border-ink-200 bg-white p-5 transition-colors hover:border-ink-300'

  return href ? (
    <Link href={href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  )
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 py-16 text-center">
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1.5 text-sm text-ink-500">{description}</p>}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'success' | 'warning' | 'info' | 'muted'
}) {
  const tones = {
    neutral: 'bg-ink-100 text-ink-700',
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-green-50 text-green-700',
    warning: 'bg-amber-50 text-amber-700',
    info: 'bg-blue-50 text-blue-700',
    muted: 'bg-ink-50 text-ink-400',
  }
  return (
    <span
      className={cx(
        'inline-block rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}

export const inputClass =
  'h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'

export const textareaClass =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-400 focus:border-brand-500'

export const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-800'

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={className}>
      <label className="block">
        <span className={labelClass}>{label}</span>
        {children}
      </label>
      {hint && <p className="mt-1.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}
