import {
  Battery,
  BatteryCharging,
  Bike,
  Briefcase,
  CircleDot,
  Cog,
  Disc,
  Disc3,
  Droplets,
  Fan,
  Fuel,
  Gauge,
  Lightbulb,
  OctagonAlert,
  Package,
  Settings2,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  battery: Battery,
  'battery-charging': BatteryCharging,
  bike: Bike,
  briefcase: Briefcase,
  'circle-dot': CircleDot,
  cog: Cog,
  disc: Disc,
  'disc-3': Disc3,
  droplets: Droplets,
  fan: Fan,
  fuel: Fuel,
  gauge: Gauge,
  lightbulb: Lightbulb,
  'octagon-alert': OctagonAlert,
  package: Package,
  'settings-2': Settings2,
  stethoscope: Stethoscope,
  wrench: Wrench,
}

export function CategoryIcon({
  name,
  className,
}: {
  name?: string | null
  className?: string
}) {
  const Icon = (name && ICONS[name]) || Package
  return <Icon className={className} strokeWidth={1.6} aria-hidden />
}

export const ICON_NAMES = Object.keys(ICONS)
