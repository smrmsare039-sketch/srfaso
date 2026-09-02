'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Package,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Truck,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { ADMIN_NAV } from '@/lib/nav'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { cx } from '@/lib/utils'

const ICONS: Record<string, LucideIcon> = {
  'layout-dashboard': LayoutDashboard,
  package: Package,
  'folder-tree': FolderTree,
  'shopping-cart': ShoppingCart,
  users: Users,
  mail: Mail,
  store: Store,
  wrench: Wrench,
  'badge-check': BadgeCheck,
  megaphone: Megaphone,
  truck: Truck,
  settings: Settings,
  shield: Shield,
}

const STORAGE_KEY = 'srfaso.admin.sidebar'

export function AdminShell({
  children,
  fullName,
  email,
  badges,
}: {
  children: React.ReactNode
  fullName: string
  email: string
  badges: { orders: number; messages: number }
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Préférence stockée dans le navigateur : lisible seulement après hydratation.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {
      // stockage indisponible
    }
  }, [])

  // Fermeture des menus lors d'un changement de route, ajustée
  // pendant le rendu plutôt que dans un effet.
  const [lastPath, setLastPath] = useState(pathname)
  if (lastPath !== pathname) {
    setLastPath(pathname)
    if (mobileOpen) setMobileOpen(false)
    if (menuOpen) setMenuOpen(false)
  }

  // Menu du compte : fermeture au clic extérieur et à la touche Échap.
  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // stockage indisponible
      }
      return next
    })
  }

  async function signOut() {
    setSigningOut(true)
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
    } finally {
      router.replace('/admin/login')
      router.refresh()
    }
  }

  const current = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))

  const sidebar = (
    <div className="flex h-full flex-col bg-ink-950 text-ink-300">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white p-1">
            <BrandLogo className="h-full" />
          </span>
          {!collapsed && (
            <span className="truncate font-display text-sm font-extrabold text-white">
              SR Motorcycle
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
          className="ml-auto hidden size-8 shrink-0 place-items-center rounded-lg bg-brand-600/15 text-brand-500 transition-colors hover:bg-brand-600 hover:text-white lg:grid"
        >
          <ChevronLeft className={cx('size-4 transition-transform', collapsed && 'rotate-180')} />
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
          className="ml-auto grid size-9 shrink-0 place-items-center rounded-lg text-ink-400 hover:bg-white/10 lg:hidden"
        >
          <X className="size-5" />
        </button>
      </div>

      <nav className="scroll-thin flex-1 overflow-y-auto p-2.5">
        <ul className="space-y-0.5">
          {ADMIN_NAV.map((item) => {
            const Icon = ICONS[item.icon] ?? LayoutDashboard
            const active = current?.href === item.href
            const badge =
              item.href === '/admin/commandes'
                ? badges.orders
                : item.href === '/admin/messages'
                  ? badges.messages
                  : 0
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={cx(
                    'flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-brand-600 text-white'
                      : 'text-ink-300 hover:bg-white/10 hover:text-white',
                    collapsed && 'justify-center px-0'
                  )}
                >
                  <Icon className="size-[1.125rem] shrink-0" strokeWidth={1.8} aria-hidden />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {badge > 0 && !collapsed && (
                    <span
                      className={cx(
                        'ml-auto grid min-w-5 place-items-center rounded-full bg-brand-500 px-1 text-[0.6875rem] font-bold text-white',
                        active && 'bg-white text-brand-700'
                      )}
                    >
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Sidebar fixe */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 lg:block"
        style={{ width: collapsed ? '4.5rem' : '14rem' }}
      >
        {sidebar}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-ink-950/60"
          />
          <div className="absolute inset-y-0 left-0 w-56">{sidebar}</div>
        </div>
      )}

      <div
        className={cx(
          'flex min-h-screen flex-col transition-[padding] duration-200',
          collapsed ? 'lg:pl-[4.5rem]' : 'lg:pl-56'
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200 bg-white px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Ouvrir le menu"
            className="grid size-10 place-items-center rounded-xl border border-ink-200 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <h1 className="truncate text-lg font-bold text-ink-900">
            {current?.label ?? 'Back-office'}
          </h1>

          <div ref={menuRef} className="relative ml-auto">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Menu du compte"
              className="flex items-center gap-3 rounded-xl py-1 pr-2 pl-2 transition-colors hover:bg-ink-50"
            >
              <span className="hidden text-right leading-tight sm:block">
                <span className="block text-sm font-semibold text-ink-900">{fullName}</span>
                <span className="block text-xs text-ink-400">{email}</span>
              </span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {fullName.slice(0, 2).toUpperCase()}
              </span>
              <ChevronDown
                className={cx(
                  'size-4 shrink-0 text-ink-400 transition-transform',
                  menuOpen && 'rotate-180'
                )}
                aria-hidden
              />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="animate-fade-up absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-pop"
              >
                <div className="border-b border-ink-100 px-3 py-2.5 sm:hidden">
                  <span className="block text-sm font-semibold text-ink-900">{fullName}</span>
                  <span className="block truncate text-xs text-ink-400">{email}</span>
                </div>

                <Link
                  href="/"
                  target="_blank"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-ink-700 transition-colors hover:bg-ink-50 hover:text-ink-900"
                >
                  <ExternalLink className="size-[1.125rem] shrink-0" strokeWidth={1.8} aria-hidden />
                  Voir le site
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={signOut}
                  disabled={signingOut}
                  className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-60"
                >
                  <LogOut className="size-[1.125rem] shrink-0" strokeWidth={1.8} aria-hidden />
                  {signingOut ? 'Déconnexion…' : 'Déconnexion'}
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
