'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ChevronRight, Menu, X } from 'lucide-react'
import { MAIN_NAV } from '@/lib/nav'
import { cx, telLink, whatsappLink } from '@/lib/utils'
import { WhatsAppIcon } from '@/components/whatsapp-icon'

export function MainNav() {
  const pathname = usePathname()
  return (
    <nav aria-label="Navigation principale" className="hidden lg:block">
      <ul className="flex items-center gap-1">
        {MAIN_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cx(
                  'relative block rounded-lg px-3 py-2 text-[15px] font-semibold transition-colors',
                  active ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'
                )}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600" />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export function MobileNav({
  phone,
  whatsapp,
}: {
  phone: string | null
  whatsapp: string | null
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    if (open) setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        className="grid size-11 place-items-center rounded-full border border-ink-200 text-ink-900 lg:hidden"
      >
        <Menu className="size-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink-950/50"
          />
          <div className="animate-fade-up absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-white">
            <div className="flex h-16 items-center justify-between border-b border-ink-100 px-4">
              <span className="font-display text-lg font-extrabold">
                <span className="text-ink-900">SUPER</span>
                <span className="text-brand-600"> &amp; RESISTANT</span>
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="grid size-10 place-items-center rounded-full hover:bg-ink-50"
              >
                <X className="size-5" />
              </button>
            </div>

            <ul className="scroll-thin flex-1 overflow-y-auto p-2">
              {MAIN_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-ink-50"
                  >
                    {item.label}
                    <ChevronRight className="size-4 text-ink-300" />
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/compte"
                  className="flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-semibold text-ink-800 hover:bg-ink-50"
                >
                  Mon compte
                  <ChevronRight className="size-4 text-ink-300" />
                </Link>
              </li>
            </ul>

            <div className="space-y-2 border-t border-ink-100 p-4">
              {whatsapp && (
                <a
                  href={whatsappLink(whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-center text-sm font-bold text-white"
                >
                  <WhatsAppIcon className="size-4" />
                  Discuter sur WhatsApp
                </a>
              )}
              {phone && (
                <a
                  href={telLink(phone)}
                  className="block rounded-xl border border-ink-200 px-4 py-3 text-center text-sm font-semibold text-ink-900"
                >
                  Appeler {phone}
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
