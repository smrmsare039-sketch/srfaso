'use server'

import { getCurrentUser } from '@/lib/account'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { CartLine } from '@/lib/types'

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string }

function clean(value: FormDataEntryValue | null, max = 300): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 8 && digits.length <= 15
}

/** Passage de commande sans compte : nom, prénom, WhatsApp, ville, e-mail facultatif. */
export async function createOrder(
  formData: FormData,
  lines: CartLine[]
): Promise<ActionResult<{ reference: string }>> {
  const firstName = clean(formData.get('first_name'), 80)
  const lastName = clean(formData.get('last_name'), 80)
  const phone = clean(formData.get('phone'), 30)
  const email = clean(formData.get('email'), 160)
  const city = clean(formData.get('city'), 80)
  const district = clean(formData.get('district'), 160)
  const notes = clean(formData.get('notes'), 1000)

  if (!firstName || !lastName) return { ok: false, error: 'Le nom et le prénom sont obligatoires.' }
  if (!isValidPhone(phone)) return { ok: false, error: 'Le numéro WhatsApp n’est pas valide.' }
  if (!city) return { ok: false, error: 'La ville est obligatoire.' }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'L’adresse e-mail n’est pas valide.' }
  }
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: 'Votre panier est vide.' }
  }

  const supabase = createSupabaseAdminClient()

  // Commande rattachée au compte si le client est connecté : c'est ce qui
  // alimente l'historique de /compte/commandes.
  const user = await getCurrentUser()

  // Les prix sont relus en base : le panier du navigateur ne fait pas foi.
  const ids = [...new Set(lines.map((l) => l.productId))].slice(0, 60)
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id,name,slug,price,stock,is_active,product_images(url,position,is_primary)')
    .in('id', ids)

  if (productsError) return { ok: false, error: 'Impossible de vérifier les produits.' }

  type Row = {
    id: string
    name: string
    slug: string
    price: number
    stock: number
    is_active: boolean
    product_images: { url: string; position: number; is_primary: boolean }[]
  }
  const byId = new Map((products as Row[] | null)?.map((p) => [p.id, p]) ?? [])

  const items = lines
    .map((line) => {
      const product = byId.get(line.productId)
      if (!product || !product.is_active) return null
      const quantity = Math.max(1, Math.min(999, Math.floor(line.quantity)))
      const unitPrice = Number(product.price)
      const image = [...(product.product_images ?? [])].sort(
        (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.position - b.position
      )[0]
      return {
        product_id: product.id,
        product_name: product.name,
        product_slug: product.slug,
        image_url: image?.url ?? null,
        unit_price: unitPrice,
        quantity,
        total: unitPrice * quantity,
      }
    })
    .filter((i): i is NonNullable<typeof i> => i !== null)

  if (items.length === 0) {
    return { ok: false, error: 'Les produits du panier ne sont plus disponibles.' }
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)

  const { data: refData, error: refError } = await supabase.rpc('next_order_reference')
  const reference =
    !refError && typeof refData === 'string'
      ? refData
      : `SR-${Date.now().toString(36).toUpperCase().slice(-8)}`

  // Fiche client : une ligne par numéro de téléphone.
  const fullName = `${firstName} ${lastName}`.trim()
  const { data: customer } = await supabase
    .from('customers')
    .upsert(
      {
        phone,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        email: email || null,
        city,
        district: district || null,
        ...(user ? { user_id: user.id } : {}),
      },
      { onConflict: 'phone' }
    )
    .select('id,orders_count,total_spent')
    .single()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      reference,
      customer_id: customer?.id ?? null,
      user_id: user?.id ?? null,
      first_name: firstName,
      last_name: lastName,
      phone,
      email: email || null,
      city,
      district: district || null,
      notes: notes || null,
      channel: 'site',
      status: 'nouvelle',
      subtotal,
      delivery_fee: 0,
      total: subtotal,
    })
    .select('id,reference')
    .single()

  if (orderError || !order) {
    return { ok: false, error: 'La commande n’a pas pu être enregistrée. Réessayez.' }
  }

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(items.map((i) => ({ ...i, order_id: order.id })))

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { ok: false, error: 'La commande n’a pas pu être enregistrée. Réessayez.' }
  }

  if (customer) {
    await supabase
      .from('customers')
      .update({
        orders_count: (customer.orders_count ?? 0) + 1,
        total_spent: Number(customer.total_spent ?? 0) + subtotal,
      })
      .eq('id', customer.id)
  }

  return { ok: true, data: { reference: order.reference } }
}

/** Formulaire de contact public. */
export async function sendContactMessage(formData: FormData): Promise<ActionResult> {
  const name = clean(formData.get('name'), 120)
  const phone = clean(formData.get('phone'), 30)
  const email = clean(formData.get('email'), 160)
  const subject = clean(formData.get('subject'), 160)
  const message = clean(formData.get('message'), 4000)
  const honeypot = clean(formData.get('website'), 100)

  if (honeypot) return { ok: true }
  if (!name) return { ok: false, error: 'Votre nom est obligatoire.' }
  if (!isValidPhone(phone)) return { ok: false, error: 'Le numéro de téléphone n’est pas valide.' }
  if (message.length < 5) return { ok: false, error: 'Merci de détailler votre demande.' }
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: 'L’adresse e-mail n’est pas valide.' }
  }

  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from('contact_messages').insert({
    name,
    phone,
    email: email || null,
    subject: subject || null,
    message,
  })

  if (error) return { ok: false, error: 'L’envoi a échoué. Réessayez dans un instant.' }
  return { ok: true }
}
