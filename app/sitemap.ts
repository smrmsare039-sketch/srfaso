import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/app/layout'
import { createSupabasePublicClient } from '@/lib/supabase/public'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/produits`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/categories`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE_URL}/suivi`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/boutiques`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/mecanique`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: 'yearly', priority: 0.6 },
    {
      url: `${SITE_URL}/livraison-retour`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  try {
    const supabase = createSupabasePublicClient()
    const [{ data: categories }, { data: products }] = await Promise.all([
      supabase.from('categories').select('slug,updated_at').eq('is_active', true),
      supabase
        .from('products')
        .select('slug,updated_at')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(20000),
    ])

    return [
      ...staticRoutes,
      ...((categories as { slug: string; updated_at: string }[] | null) ?? []).map((c) => ({
        url: `${SITE_URL}/categories/${c.slug}`,
        lastModified: new Date(c.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...((products as { slug: string; updated_at: string }[] | null) ?? []).map((p) => ({
        url: `${SITE_URL}/produits/${p.slug}`,
        lastModified: new Date(p.updated_at),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch {
    return staticRoutes
  }
}
