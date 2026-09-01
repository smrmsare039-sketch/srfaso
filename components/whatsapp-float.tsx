import { WhatsAppIcon } from '@/components/whatsapp-icon'
import { whatsappLink } from '@/lib/utils'

export function WhatsAppFloat({
  number,
  message,
}: {
  number: string | null
  message?: string | null
}) {
  if (!number) return null

  return (
    <a
      href={whatsappLink(number, message ?? undefined)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Discuter avec nous sur WhatsApp"
      className="fixed right-4 bottom-5 z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] py-3 pr-5 pl-3 font-semibold text-white shadow-pop transition-transform hover:scale-105"
    >
      <WhatsAppIcon className="size-6 shrink-0" />
      <span className="hidden text-sm sm:inline">Discuter avec nous</span>
    </a>
  )
}
