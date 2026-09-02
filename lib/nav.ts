export const MAIN_NAV = [
  { href: '/produits', label: 'Produits' },
  { href: '/categories', label: 'Catégories' },
  { href: '/boutiques', label: 'Boutiques' },
  { href: '/mecanique', label: 'Mécanique' },
  { href: '/contact', label: 'Contact' },
  { href: '/livraison-retour', label: 'Livraison & Retour' },
] as const

export const ADMIN_NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: 'layout-dashboard' },
  { href: '/admin/produits', label: 'Produits', icon: 'package' },
  { href: '/admin/categories', label: 'Catégories', icon: 'folder-tree' },
  { href: '/admin/commandes', label: 'Commandes', icon: 'shopping-cart' },
  { href: '/admin/clients', label: 'Clients', icon: 'users' },
  { href: '/admin/messages', label: 'Messages', icon: 'mail' },
  { href: '/admin/boutiques', label: 'Boutiques', icon: 'store' },
  { href: '/admin/mecanique', label: 'Mécanique', icon: 'wrench' },
  { href: '/admin/marques', label: 'Marques', icon: 'badge-check' },
  { href: '/admin/promotion', label: 'Promotion', icon: 'megaphone' },
  { href: '/admin/livraison', label: 'Livraison & Retour', icon: 'truck' },
  { href: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
  { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: 'shield' },
] as const
