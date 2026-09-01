import type { Metadata } from 'next'
import { Suspense } from 'react'
import { LoginForm } from '@/components/admin/login-form'
import { BrandLogo } from '@/components/brand-logo'

export const metadata: Metadata = {
  title: 'Connexion back-office',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-ink-950 px-5 py-12">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white p-7 sm:p-9">
          <div className="mb-8 text-center">
            <BrandLogo priority className="mx-auto h-24" />
            <h1 className="sr-only">SUPER &amp; RESISTANT</h1>
            <p className="mt-4 text-sm text-ink-500">Espace d’administration</p>
          </div>
          <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-ink-50" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-ink-500">
          Accès réservé aux administrateurs de SR Faso.
        </p>
      </div>
    </div>
  )
}
