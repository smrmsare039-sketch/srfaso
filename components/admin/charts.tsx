'use client'

import { useId, useState } from 'react'
import { cx } from '@/lib/utils'

/**
 * Graphiques du tableau de bord : SVG pur, sans dépendance externe.
 *
 * Palette catégorielle validée (séparation daltonisme et vision normale) —
 * l'ordre est fixe, jamais recyclé : au-delà de 6 séries on regroupe en « Autres ».
 * Les teintes ayant un contraste faible sur fond blanc sont toujours accompagnées
 * d'un libellé écrit (légende ou étiquette), jamais de la couleur seule.
 */
export const SERIES_COLORS = [
  '#2a78d6', // bleu
  '#eb6834', // orange
  '#1baf7a', // aqua
  '#eda100', // jaune
  '#e87ba4', // magenta
  '#008300', // vert
] as const

const AXIS = '#a8a8a3'
const GRID = '#ececea'
const INK = '#16161a'

export type TrendPoint = { label: string; value: number }

/**
 * Courbe d'évolution (une seule série : pas de légende, le titre nomme la mesure).
 * Survol : repère vertical + infobulle.
 */
export function TrendChart({
  points,
  color = '#e60d12',
  formatValue,
  height = 220,
}: {
  points: TrendPoint[]
  color?: string
  formatValue: (value: number) => string
  height?: number
}) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  if (points.length < 2) {
    return <p className="py-10 text-center text-sm text-ink-400">Pas encore assez de données.</p>
  }

  const width = 720
  const pad = { top: 16, right: 12, bottom: 26, left: 52 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom

  const max = Math.max(...points.map((p) => p.value), 1)
  const step = plotW / (points.length - 1)
  const x = (i: number) => pad.left + i * step
  const y = (v: number) => pad.top + plotH - (v / max) * plotH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ')
  const area = `${line} L${x(points.length - 1)},${pad.top + plotH} L${pad.left},${pad.top + plotH} Z`

  const ticks = [0, 0.5, 1].map((t) => ({ value: max * t, y: pad.top + plotH - t * plotH }))
  // Au plus 6 dates en abscisse pour éviter les chevauchements.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6))
  const active = hover != null ? points[hover] : null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Évolution sur la période"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.y}>
            <line x1={pad.left} x2={width - pad.right} y1={t.y} y2={t.y} stroke={GRID} />
            <text x={pad.left - 8} y={t.y + 4} textAnchor="end" fontSize="11" fill={AXIS}>
              {formatValue(t.value)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />

        {points.map((p, i) =>
          i % labelEvery === 0 ? (
            <text
              key={`${p.label}-${i}`}
              x={x(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill={AXIS}
            >
              {p.label}
            </text>
          ) : null
        )}

        {active && hover != null && (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={pad.top}
              y2={pad.top + plotH}
              stroke={AXIS}
              strokeDasharray="3 3"
            />
            <circle
              cx={x(hover)}
              cy={y(active.value)}
              r="5"
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}

        {/* Zones de survol : plus larges que les points. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.label}-${i}`}
            x={x(i) - step / 2}
            y={pad.top}
            width={step}
            height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {active && (
        <p className="mt-1 text-center text-xs text-ink-500">
          <span className="font-semibold text-ink-900">{active.label}</span> ·{' '}
          {formatValue(active.value)}
        </p>
      )}
    </div>
  )
}

export type Slice = { label: string; value: number }

/** Camembert (anneau) : identité par couleur + légende chiffrée, jamais la couleur seule. */
export function DonutChart({
  slices,
  formatValue,
  centerLabel,
}: {
  slices: Slice[]
  formatValue: (value: number) => string
  centerLabel?: string
}) {
  const [hover, setHover] = useState<number | null>(null)
  const data = slices.filter((s) => s.value > 0)
  const total = data.reduce((sum, s) => sum + s.value, 0)

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-ink-400">Aucune donnée sur la période.</p>
  }

  const size = 180
  const center = size / 2
  const radius = 70
  const thickness = 26

  // Angle de départ cumulé de chaque segment, calculé sans mutation pendant le rendu.
  const offsets = data.reduce<number[]>(
    (acc, slice) => [...acc, acc[acc.length - 1] + (slice.value / total) * Math.PI * 2],
    [-Math.PI / 2]
  )

  const arcs = data.map((slice, i) => {
    const sweep = (slice.value / total) * Math.PI * 2
    // 2px de respiration entre segments (en radians, à ce rayon).
    const gap = data.length > 1 ? 2 / radius : 0
    const start = offsets[i] + gap / 2
    const end = offsets[i] + sweep - gap / 2
    const large = end - start > Math.PI ? 1 : 0
    const outer = radius
    const inner = radius - thickness
    const p = (r: number, a: number) => `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
    return {
      ...slice,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
      share: slice.value / total,
      d: `M${p(outer, start)} A${outer},${outer} 0 ${large} 1 ${p(outer, end)} L${p(inner, end)} A${inner},${inner} 0 ${large} 0 ${p(inner, start)} Z`,
    }
  })

  const active = hover != null ? arcs[hover] : null

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="size-44 shrink-0"
        role="img"
        aria-label="Répartition"
        onMouseLeave={() => setHover(null)}
      >
        {arcs.map((arc, i) => (
          <path
            key={arc.label}
            d={arc.d}
            fill={arc.color}
            opacity={hover == null || hover === i ? 1 : 0.35}
            onMouseEnter={() => setHover(i)}
          />
        ))}
        <text
          x={center}
          y={active ? center - 4 : center + 2}
          textAnchor="middle"
          fontSize="20"
          fontWeight="800"
          fill={INK}
        >
          {active ? `${Math.round(active.share * 100)}%` : formatValue(total)}
        </text>
        <text x={center} y={center + 16} textAnchor="middle" fontSize="11" fill={AXIS}>
          {active ? active.label : (centerLabel ?? '')}
        </text>
      </svg>

      <ul className="min-w-40 flex-1 space-y-2">
        {arcs.map((arc, i) => (
          <li
            key={arc.label}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-2.5 text-sm"
          >
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: arc.color }}
            />
            <span className="min-w-0 flex-1 truncate text-ink-700">{arc.label}</span>
            <span className="shrink-0 font-semibold text-ink-900">{formatValue(arc.value)}</span>
            <span className="w-10 shrink-0 text-right text-xs text-ink-400">
              {Math.round(arc.share * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export type Bar = { label: string; value: number; hint?: string }

/** Barres horizontales, une seule mesure : extrémités arrondies, valeurs affichées. */
export function BarList({
  bars,
  formatValue,
  color = SERIES_COLORS[0],
}: {
  bars: Bar[]
  formatValue: (value: number) => string
  color?: string
}) {
  if (bars.length === 0) {
    return <p className="py-10 text-center text-sm text-ink-400">Aucune donnée sur la période.</p>
  }

  const max = Math.max(...bars.map((b) => b.value), 1)

  return (
    <ul className="space-y-3.5">
      {bars.map((bar) => (
        <li key={bar.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink-700">{bar.label}</span>
            <span className="shrink-0 font-semibold text-ink-900">{formatValue(bar.value)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded bg-ink-50">
            <div
              className="h-full rounded"
              style={{ width: `${Math.max(2, (bar.value / max) * 100)}%`, backgroundColor: color }}
            />
          </div>
          {bar.hint && <p className="mt-1 text-xs text-ink-400">{bar.hint}</p>}
        </li>
      ))}
    </ul>
  )
}

/** Variation par rapport à la période précédente. */
export function Delta({ value, className }: { value: number | null; className?: string }) {
  if (value == null) {
    return <span className={cx('text-xs text-ink-400', className)}>Pas de comparaison</span>
  }
  const up = value >= 0
  return (
    <span
      className={cx(
        'text-xs font-semibold',
        up ? 'text-green-600' : 'text-brand-600',
        className
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(Math.round(value))}% vs période précédente
    </span>
  )
}
