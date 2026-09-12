import {
  apiError,
  apiJson,
  apiPreflight,
  checkApiKey,
  listApiProducts,
  parseProductQuery,
} from '@/lib/public-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products
 * Liste paginée des produits actifs avec leurs détails complets.
 */
export async function GET(request: Request) {
  const denied = checkApiKey(request)
  if (denied) return denied

  const url = new URL(request.url)
  const parsed = parseProductQuery(url.searchParams)
  if ('error' in parsed) return apiError(400, 'invalid_parameter', parsed.error)
  const { query } = parsed

  try {
    const { products, total } = await listApiProducts(query)
    const pages = Math.max(1, Math.ceil(total / query.perPage))

    const pageLink = (page: number) => {
      const next = new URL(url)
      next.searchParams.set('page', String(page))
      return next.toString()
    }

    return apiJson({
      data: products,
      meta: { total, page: query.page, per_page: query.perPage, pages },
      links: {
        self: url.toString(),
        next: query.page < pages ? pageLink(query.page + 1) : null,
        prev: query.page > 1 ? pageLink(Math.min(query.page - 1, pages)) : null,
      },
    })
  } catch {
    return apiError(500, 'server_error', 'Impossible de récupérer les produits.')
  }
}

export function OPTIONS() {
  return apiPreflight()
}
