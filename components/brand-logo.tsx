import Image from 'next/image'

/** Logo officiel SUPER & RESISTANT (aigle noir, casque rouge, sur fond blanc). */
export function BrandLogo({
  className = '',
  priority,
  alt = 'SUPER & RESISTANT',
}: {
  className?: string
  priority?: boolean
  alt?: string
}) {
  return (
    <Image
      src="/srfaso.png"
      alt={alt}
      width={479}
      height={520}
      priority={priority}
      className={`w-auto object-contain ${className}`}
    />
  )
}
