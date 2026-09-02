export type MapPlace = {
  name: string
  address: string | null
  city?: string | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * URL d'intégration Google Maps — sans clé API ni script tiers.
 * Les coordonnées GPS priment ; sinon l'adresse est géocodée par Google.
 * `map_url` n'est volontairement pas utilisée ici : un lien partagé
 * (maps.app.goo.gl) refuse d'être affiché dans une iframe.
 */
export function mapEmbedUrl(place: MapPlace): string {
  const query =
    place.latitude != null && place.longitude != null
      ? `${place.latitude},${place.longitude}`
      : [place.name, place.address, place.city].filter(Boolean).join(', ')
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&hl=fr&z=16&output=embed`
}

/** Carte Google Maps intégrée, chargée en différé. */
export function MapEmbed({
  place,
  title,
  className = 'aspect-[4/3]',
}: {
  place: MapPlace
  title?: string
  className?: string
}) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-ink-100 bg-ink-50 ${className}`}>
      <iframe
        src={mapEmbedUrl(place)}
        title={title ?? `Carte — ${place.name}`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
        className="size-full border-0"
      />
    </div>
  )
}
