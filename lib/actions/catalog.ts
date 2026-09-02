'use server'

import { getProducts, type ProductFilters } from '@/lib/data'
import type { ProductWithRelations } from '@/lib/types'

/** Page suivante du catalogue pour le chargement automatique au scroll. */
export async function loadMoreProducts(
  filters: ProductFilters,
  page: number
): Promise<{ products: ProductWithRelations[]; total: number; pages: number }> {
  const { products, total, pages } = await getProducts({ ...filters, page })
  return { products, total, pages }
}
