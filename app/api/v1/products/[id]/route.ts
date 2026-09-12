import { apiError, apiJson, apiPreflight, checkApiKey, getApiProduct } from '@/lib/public-api'

export const dynamic = 'force-dynamic'

/**
 * GET /api/v1/products/:id
 * Détail complet d'un produit actif, par identifiant (uuid) ou par slug.
 */
export async function GET(request: Request, ctx: RouteContext<'/api/v1/products/[id]'>) {
  const denied = checkApiKey(request)
  if (denied) return denied

  const { id } = await ctx.params

  try {
    const product = await getApiProduct(decodeURIComponent(id))
    if (!product) return apiError(404, 'not_found', 'Produit introuvable.')
    return apiJson({ data: product })
  } catch {
    return apiError(500, 'server_error', 'Impossible de récupérer le produit.')
  }
}

export function OPTIONS() {
  return apiPreflight()
}
