import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

type SearchRow = {
  id: string
  name: string
  slug: string
  reference: string | null
  brand: string | null
  price: number
  old_price: number | null
  stock: number
  category_name: string | null
  category_slug: string | null
  image_url: string | null
}

export async function GET(request: Request) {
  const term = (new URL(request.url).searchParams.get('q') ?? '').trim()
  if (term.length < 2) {
    return NextResponse.json({ products: [], categories: [] })
  }

  try {
    const supabase = await createSupabaseServerClient()

    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.rpc('search_products', { q: term, max_results: 8 }),
      supabase
        .from('categories')
        .select('id,name,slug')
        .eq('is_active', true)
        .ilike('name', `%${term}%`)
        .limit(4),
    ])

    return NextResponse.json({
      products: (products as SearchRow[] | null) ?? [],
      categories: categories ?? [],
    })
  } catch {
    return NextResponse.json({ products: [], categories: [] })
  }
}
