import { ASSETS, placeholderColor } from '../assets/registry'

/**
 * SVG-Gegenstücke der pinken Pixi-Platzhalter für Karten, Avatare und Feiern.
 * Sie lesen Farbe und Form aus der Asset-Registry, damit UI und Spielzimmer gleich aussehen.
 */
const OUTLINE = '#9e477d'
const FACE = '#50394c'

interface CreatureArtProps {
  assetId: string
  locked?: boolean
  mood?: 'calm' | 'happy'
  className?: string
}

export function CreatureArt({ assetId, locked = false, mood = 'calm', className }: CreatureArtProps) {
  const color = locked ? 'var(--night-500)' : placeholderColor(assetId)
  // Farben laufen über style, damit CSS-Variablen auch in SVG zuverlässig greifen.
  const fill = { fill: color }
  return (
    <svg className={`creature-art${className ? ` ${className}` : ''}`} viewBox="-100 -92 200 176" aria-hidden="true" focusable="false">
      <ellipse cx="-48" cy="-42" rx="23" ry="37" style={fill} />
      <ellipse cx="48" cy="-42" rx="23" ry="37" style={fill} />
      <ellipse cx="0" cy="10" rx="72" ry="60" style={{ ...fill, stroke: locked ? 'var(--night-400)' : OUTLINE }} strokeWidth="3" />
      {locked ? (
        <text x="0" y="30" textAnchor="middle" fontSize="64" fontWeight="700" style={{ fill: 'var(--night-300)', fontFamily: 'var(--font-display)' }}>?</text>
      ) : mood === 'happy' ? (
        <g fill="none" stroke={FACE} strokeWidth="4" strokeLinecap="round">
          <path d="M-32 8q8-10 16 0M16 8q8-10 16 0" />
          <path d="M-12 22q12 14 24 0" stroke={OUTLINE} />
        </g>
      ) : (
        <g>
          <circle cx="-24" cy="5" r="4" fill={FACE} />
          <circle cx="24" cy="5" r="4" fill={FACE} />
          <path d="M-9 24q9 10 18 0" fill="none" stroke={OUTLINE} strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export function ProductArt({ assetId, className }: { assetId: string; className?: string }) {
  const source = ASSETS[assetId]?.source
  const shape = source?.type === 'generated' ? source.shape : 'sparkle'
  if (shape === 'round-creature') return <CreatureArt assetId={assetId} className={className} />
  const color = placeholderColor(assetId)
  const stroke = { stroke: OUTLINE, strokeWidth: 3, strokeLinejoin: 'round' as const }
  return (
    <svg className={`product-art${className ? ` ${className}` : ''}`} viewBox="-40 -84 80 100" aria-hidden="true" focusable="false">
      {shape === 'lamp' ? (
        <g fill={color} {...stroke}>
          <rect x="-5" y="-34" width="10" height="34" rx="3" />
          <ellipse cx="0" cy="6" rx="22" ry="7" />
          <path d="M-26-34h52l-12-38h-28z" />
        </g>
      ) : shape === 'ball' ? (
        <g {...stroke}>
          <circle cx="0" cy="-26" r="26" fill={color} />
          <path d="M-22-34q22 20 44 0" fill="none" />
        </g>
      ) : (
        <path d="m0-60 8.8 18 19.7 2.8-14.3 14 3.4 19.7L0-15l-17.6 9.5L-14.2-25.2-28.5-39.2-8.8-42Z" fill={color} {...stroke} />
      )}
    </svg>
  )
}
