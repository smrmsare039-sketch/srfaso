export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  if (!Number.isFinite(n)) return '0 FCFA'
  return `${new Intl.NumberFormat('fr-FR').format(Math.round(n))} FCFA`
}

export function formatNumber(value: number | string | null | undefined): string {
  return new Intl.NumberFormat('fr-FR').format(Number(value ?? 0))
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const d = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, ' ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

/** Nettoie un numéro pour un lien wa.me (chiffres uniquement). */
export function waNumber(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (!digits) return ''
  return digits.startsWith('226') ? digits : `226${digits.replace(/^0+/, '')}`
}

export function whatsappLink(raw: string | null | undefined, message?: string): string {
  const n = waNumber(raw)
  const base = n ? `https://wa.me/${n}` : 'https://wa.me/'
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

export function telLink(raw: string | null | undefined): string {
  return `tel:${(raw ?? '').replace(/\s/g, '')}`
}

export function discountPercent(price: number, oldPrice: number | null): number | null {
  if (!oldPrice || oldPrice <= price) return null
  return Math.round(((oldPrice - price) / oldPrice) * 100)
}

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

export function truncate(text: string | null | undefined, max = 160): string {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}
