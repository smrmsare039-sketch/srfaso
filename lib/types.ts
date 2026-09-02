export type OrderStatus =
  | 'nouvelle'
  | 'confirmee'
  | 'preparation'
  | 'expediee'
  | 'livree'
  | 'annulee'

export type MessageStatus = 'nouveau' | 'lu' | 'traite'

export type Spec = { label: string; value: string }

/** Visuel de la mosaïque affichée dans la bannière d'accueil. */
export type HeroTile = {
  /** Image de la tuile ; sert aussi d'image d'attente quand une vidéo est définie. */
  url: string
  /** Vidéo MP4/WebM affichée à la place de l'image. */
  video: string | null
  label: string | null
  href: string | null
}

/** Nombre de visuels gérables dans la mosaïque de la bannière. */
export const HERO_TILES_MAX = 4

/** Fond de la bannière d'accueil : rouge de la marque (défaut) ou noir. */
export type HeroBackground = 'brand' | 'dark'

export const HERO_BACKGROUNDS: Record<HeroBackground, string> = {
  brand: 'Rouge SUPER & RESISTANT (par défaut)',
  dark: 'Noir',
}

export type Category = {
  id: string
  parent_id: string | null
  name: string
  slug: string
  description: string | null
  seo_title: string | null
  seo_description: string | null
  image_url: string | null
  image_alt: string | null
  icon: string | null
  position: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type ProductImage = {
  id: string
  product_id: string
  url: string
  alt: string | null
  position: number
  is_primary: boolean
}

export type Product = {
  id: string
  name: string
  slug: string
  reference: string | null
  category_id: string | null
  subcategory_id: string | null
  brand: string | null
  price: number
  old_price: number | null
  short_description: string | null
  description: string | null
  specifications: Spec[]
  compatibility: string[]
  keywords: string[]
  stock: number
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_promo: boolean
  views: number
  sales_count: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export type ProductWithRelations = Product & {
  category: Pick<Category, 'id' | 'name' | 'slug'> | null
  images: ProductImage[]
}

export type Shop = {
  id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  city: string | null
  district: string | null
  phone: string | null
  whatsapp: string | null
  hours: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  video_url: string | null
  map_url: string | null
  position: number
  is_active: boolean
}

/** Marque partenaire affichée dans la section « Nos marques partenaires ». */
export type PartnerBrand = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  website_url: string | null
  is_primary: boolean
  position: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type Service = {
  id: string
  title: string
  slug: string
  description: string | null
  details: string | null
  price_label: string | null
  image_url: string | null
  icon: string | null
  position: number
  is_active: boolean
}

/** Photo de l'atelier affichée dans la galerie de la page /mecanique. */
export type WorkshopPhoto = {
  id: string
  title: string | null
  caption: string | null
  image_url: string
  /** Photo « avant » facultative : la fiche devient un comparatif avant / après. */
  before_url: string | null
  service_id: string | null
  position: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export type WorkshopPhotoWithService = WorkshopPhoto & {
  service: Pick<Service, 'id' | 'title' | 'slug'> | null
}

export type Customer = {
  id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  phone: string
  email: string | null
  city: string | null
  district: string | null
  orders_count: number
  total_spent: number
  created_at: string
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  product_slug: string | null
  image_url: string | null
  unit_price: number
  quantity: number
  total: number
}

export type Order = {
  id: string
  reference: string
  customer_id: string | null
  user_id: string | null
  first_name: string
  last_name: string
  phone: string
  email: string | null
  city: string
  district: string | null
  notes: string | null
  channel: 'site' | 'whatsapp'
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total: number
  admin_note: string | null
  created_at: string
  updated_at: string
}

export type OrderWithItems = Order & { items: OrderItem[] }

export type ContactMessage = {
  id: string
  name: string
  phone: string
  email: string | null
  subject: string | null
  message: string
  status: MessageStatus
  created_at: string
}

export type SiteSettings = {
  id: number
  company_name: string
  tagline: string | null
  logo_url: string | null
  favicon_url: string | null
  phone_primary: string | null
  phone_secondary: string | null
  whatsapp: string | null
  whatsapp_message: string | null
  email: string | null
  address: string | null
  hours: string | null
  delivery_title: string | null
  delivery_text: string | null
  facebook_url: string | null
  tiktok_url: string | null
  instagram_url: string | null
  youtube_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string | null
  og_image_url: string | null
  home_hero_title: string | null
  home_hero_subtitle: string | null
  home_hero_image: string | null
  home_hero_video: string | null
  home_hero_bg: HeroBackground
  home_hero_tiles: HeroTile[]
  home_brands_title: string | null
  home_brands_intro: string | null
  home_seo_content: string | null
}

/** Section « offre du moment » de la page d'accueil (ligne unique). */
export type HomePromo = {
  id: number
  is_active: boolean
  eyebrow: string | null
  title: string | null
  description: string | null
  image_url: string | null
  cta_label: string | null
  cta_href: string | null
  ends_at: string | null
  product_ids: string[]
}

/** Nombre de produits affichés sous la bannière promotionnelle. */
export const HOME_PROMO_PRODUCTS_MAX = 6

export type DeliveryContent = {
  id: number
  delivery_title: string | null
  delivery_body: string | null
  return_title: string | null
  return_body: string | null
  seo_title: string | null
  seo_description: string | null
}

export type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'editor'
  is_active: boolean
  created_at: string
}

export type CartLine = {
  productId: string
  slug: string
  name: string
  price: number
  image: string | null
  quantity: number
  stock: number
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nouvelle: 'Nouvelle',
  confirmee: 'Confirmée',
  preparation: 'En préparation',
  expediee: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
}

export const MESSAGE_STATUS_LABELS: Record<MessageStatus, string> = {
  nouveau: 'Nouveau',
  lu: 'Lu',
  traite: 'Traité',
}

export const ORDER_STATUS_TONES: Record<
  OrderStatus,
  'brand' | 'info' | 'warning' | 'success' | 'muted'
> = {
  nouvelle: 'brand',
  confirmee: 'info',
  preparation: 'warning',
  expediee: 'info',
  livree: 'success',
  annulee: 'muted',
}
