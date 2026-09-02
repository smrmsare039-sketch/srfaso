import Image from 'next/image'
import { BrandLogo } from '@/components/brand-logo'
import type { OrderWithItems, SiteSettings } from '@/lib/types'
import { formatPrice } from '@/lib/utils'

/**
 * Ticket au format thermique 80 mm (largeur utile ~72 mm).
 * Rendu en millimètres pour rester fidèle à l'impression.
 */
export function ThermalReceipt({
  order,
  settings,
  qrDataUrl,
  qrCaption,
}: {
  order: OrderWithItems
  settings: SiteSettings
  qrDataUrl: string | null
  qrCaption: string
}) {
  const issuedAt = new Date(order.created_at)
  const date = issuedAt.toLocaleDateString('fr-FR')
  const time = issuedAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const phones = [settings.phone_primary, settings.phone_secondary].filter(Boolean).join(' / ')
  const hasDelivery = Number(order.delivery_fee) > 0

  return (
    <div id="ticket" className="receipt">
      {/* Logo de la boutique s'il est configuré, sinon le logo de l'app. */}
      <div className="receipt-logo">
        {settings.logo_url ? (
          <Image
            src={settings.logo_url}
            alt={settings.company_name}
            width={220}
            height={220}
            unoptimized
            className="receipt-logo-img"
          />
        ) : (
          <BrandLogo alt={settings.company_name} className="receipt-logo-img" />
        )}
      </div>

      <h1 className="receipt-title">{settings.company_name}</h1>
      {(settings.address || phones) && (
        <p className="receipt-meta">
          {settings.address}
          {settings.address && phones ? ' — ' : ''}
          {phones && `Tél. ${phones}`}
        </p>
      )}

      <div className="receipt-rule" />

      <dl className="receipt-kv">
        <div>
          <dt>Reçu n°</dt>
          <dd className="font-bold">{order.reference}</dd>
        </div>
        <div>
          <dt>Date</dt>
          <dd>
            {date} · {time}
          </dd>
        </div>
        <div>
          <dt>Client</dt>
          <dd>
            {order.first_name} {order.last_name}
          </dd>
        </div>
        <div>
          <dt>Téléphone</dt>
          <dd>{order.phone}</dd>
        </div>
        <div>
          <dt>Livraison</dt>
          <dd>
            {order.city}
            {order.district ? `, ${order.district}` : ''}
          </dd>
        </div>
      </dl>

      <div className="receipt-rule" />
      <p className="receipt-section">Articles</p>

      <ul className="receipt-items">
        {(order.items ?? []).map((item) => (
          <li key={item.id}>
            <span className="receipt-item-name">{item.product_name}</span>
            <span className="receipt-item-line">
              <span>
                {item.quantity} × {formatPrice(item.unit_price)}
              </span>
              <span className="font-bold">{formatPrice(item.total)}</span>
            </span>
          </li>
        ))}
      </ul>

      <div className="receipt-rule" />

      <div className="receipt-kv">
        <div>
          <dt>Sous-total</dt>
          <dd>{formatPrice(order.subtotal)}</dd>
        </div>
        {hasDelivery && (
          <div>
            <dt>Livraison</dt>
            <dd>{formatPrice(order.delivery_fee)}</dd>
          </div>
        )}
      </div>

      <div className="receipt-total">
        <span>TOTAL</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      {qrDataUrl && (
        <div className="receipt-qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="" width={240} height={240} className="receipt-qr-img" />
          <p className="receipt-meta">{qrCaption}</p>
        </div>
      )}

      <p className="receipt-thanks">Merci pour votre achat !</p>
      <p className="receipt-footer">{settings.company_name} — Ouagadougou, Burkina Faso</p>
    </div>
  )
}
