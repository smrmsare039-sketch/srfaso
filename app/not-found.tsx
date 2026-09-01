import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-display text-7xl font-black text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-extrabold text-ink-900">Page introuvable</h1>
        <p className="mt-3 max-w-md text-ink-500">
          La page que vous cherchez n’existe pas ou a été déplacée. Reprenez depuis l’accueil ou le
          catalogue.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-xl bg-brand-600 px-6 py-3 text-[0.9375rem] font-bold text-white hover:bg-brand-700"
          >
            Retour à l’accueil
          </Link>
          <Link
            href="/produits"
            className="rounded-xl border border-ink-200 px-6 py-3 text-[0.9375rem] font-semibold text-ink-800 hover:border-ink-900"
          >
            Voir les produits
          </Link>
        </div>
      </div>
    </div>
  )
}
