import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { ToastProvider } from '@/components/toast'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
})

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://srfaso.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Pièces détachées moto au Burkina Faso | SR Faso',
    template: '%s | SR Faso',
  },
  description:
    'SUPER & RESISTANT (SR Faso) : pièces détachées moto, accessoires et services de mécanique à Ouagadougou, Bobo-Dioulasso et partout au Burkina Faso.',
  applicationName: 'SR Faso',
  authors: [{ name: 'SUPER & RESISTANT' }],
  openGraph: {
    type: 'website',
    locale: 'fr_BF',
    siteName: 'SUPER & RESISTANT',
    url: SITE_URL,
    images: [{ url: '/srfaso.png', width: 479, height: 520, alt: 'SUPER & RESISTANT' }],
  },
  twitter: { card: 'summary_large_image', images: ['/srfaso.png'] },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  themeColor: '#f59e00',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${inter.variable} ${outfit.variable} h-full`}>
      <body className="min-h-full">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
