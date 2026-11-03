import type { CSSProperties } from 'react'

/**
 * Fabelnest-Iconset: 24er-Raster, 2 px Linie, runde Enden. `filled` füllt nur Werte-Icons
 * (Stern, Herz, Apfel, Mond, Blitz, Funkeln, Play). Icons sind immer dekorativ; die Beschriftung trägt der Button.
 */
const PATHS = {
  nest: 'M3.5 11 12 4l8.5 7M5.5 9.5V19a1.5 1.5 0 0 0 1.5 1.5h3.5V15h3v5.5H17a1.5 1.5 0 0 0 1.5-1.5V9.5',
  tasks: 'M9 4.5h6M9 3h6a1 1 0 0 1 1 1v1.5a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM16 4.5h1.5A1.5 1.5 0 0 1 19 6v13.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19.5V6a1.5 1.5 0 0 1 1.5-1.5H8M8.5 13.5l2.2 2.2 4.8-4.9',
  shop: 'M5 8.5h14l-1.2 11a1.5 1.5 0 0 1-1.5 1.3H7.7a1.5 1.5 0 0 1-1.5-1.3L5 8.5ZM9 10.5V7a3 3 0 0 1 6 0v3.5',
  collection: 'M12 20.5c-3 0-5.5-1.6-5.5-3.8 0-2.6 2.8-5.2 5.5-5.2s5.5 2.6 5.5 5.2c0 2.2-2.5 3.8-5.5 3.8ZM6.2 11.2a1.8 2.2 0 1 0 0-.1M17.8 11.2a1.8 2.2 0 1 0 0-.1M9.4 7.4a1.9 2.4 0 1 0 0-.1M14.6 7.4a1.9 2.4 0 1 0 0-.1',
  star: 'm12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z',
  heart: 'M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.4C19.5 15.4 12 20 12 20Z',
  apple: 'M12 8.2c-1.6-1.1-5.2-1.3-6.3 1.9-1.2 3.6 1.4 9.4 4.2 10.5 1 .4 1.5 0 2.1 0s1.1.4 2.1 0c2.8-1.1 5.4-6.9 4.2-10.5-1.1-3.2-4.7-3-6.3-1.9ZM12 8.2c0-2.2.9-3.8 3-4.7',
  moon: 'M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1Z',
  bolt: 'M13.2 2.8 5 13.5h6.2l-1 7.7 8.3-10.8h-6.2l.9-7.6Z',
  ball: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM4 9.5c4.5 2 11.5 2 16 0M7 18.5c1.5-4.5 1.5-9.5 0-13M17 18.5c-1.5-4.5-1.5-9.5 0-13',
  hand: 'M8.5 12.5V6a1.5 1.5 0 0 1 3 0v5.5M11.5 11V4.5a1.5 1.5 0 0 1 3 0V11M14.5 11V6a1.5 1.5 0 0 1 3 0v7.5a7 7 0 0 1-7 7h-.3a6.5 6.5 0 0 1-5-2.4l-2.4-3a1.6 1.6 0 0 1 2.4-2.1l1.3 1.5',
  pencil: 'M4.5 19.5h3.8L19 8.8a2 2 0 0 0 0-2.8l-1-1a2 2 0 0 0-2.8 0L4.5 15.7v3.8ZM13.8 6.4l3.8 3.8',
  close: 'M6.5 6.5l11 11M17.5 6.5l-11 11',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11ZM12 14.5v2.5',
  check: 'm5 12.5 4.5 4.5L19 7.5',
  hourglass: 'M7 3.5h10M7 20.5h10M8 3.5v2.8a4 4 0 0 0 1.7 3.3L12 11.3l2.3-1.7A4 4 0 0 0 16 6.3V3.5M8 20.5v-2.8a4 4 0 0 1 1.7-3.3l2.3-1.7 2.3 1.7a4 4 0 0 1 1.7 3.3v2.8',
  sparkle: 'M12 3.5 13.9 9l5.6 2-5.6 2L12 18.5 10.1 13l-5.6-2 5.6-2L12 3.5ZM18.5 3v3M17 4.5h3',
  rocket: 'M12 2.8c3.2 2.2 5 6.2 4.6 10.4L15 16.5H9l-1.6-3.3C7 9 8.8 5 12 2.8ZM12 11a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6ZM9 16.5l-2.5 3 .3-4.6M15 16.5l2.5 3-.3-4.6M10.5 19.5 12 21.5l1.5-2',
  sofa: 'M5 11V8.5a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3V11M3 13a2 2 0 0 1 4 0v1.5h10V13a2 2 0 0 1 4 0v4.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V13ZM5.5 18.5v1.5M18.5 18.5v1.5',
  info: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17ZM12 11v5.5M12 7.8v.2',
  chevron: 'm9.5 5.5 6.5 6.5-6.5 6.5',
  back: 'M14.5 5.5 8 12l6.5 6.5',
  trophy: 'M8 4h8v5.5a4 4 0 0 1-8 0V4ZM8 6H5.5a2.8 2.8 0 0 0 3 4M16 6h2.5a2.8 2.8 0 0 1-3 4M12 13.5v3.5M8.5 20.5h7M9.5 17h5v3.5h-5z',
  pizza: 'M12 21 3.4 6.4a17 17 0 0 1 17.2 0L12 21ZM4.6 8.5a14.5 14.5 0 0 1 14.8 0M10 11.5h.1M14 13.5h.1M12 17h.1',
  history: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9M4.5 4.5V9H9M12 8v4.5l3 2',
  key: 'M14.5 13.5a5 5 0 1 0-4.8-3.7L3.5 16v3.5H7v-2h2v-2h2l1.1-1.1a5 5 0 0 0 2.4-.9ZM16 8h.1',
  swap: 'M7 4.5 3.5 8 7 11.5M3.5 8h13M17 12.5l3.5 3.5-3.5 3.5M20.5 16h-13',
  plus: 'M12 5v14M5 12h14',
  up: 'M12 19V5.5M6 11.5l6-6 6 6',
  down: 'M12 5v13.5M6 12.5l6 6 6-6',
  pause: 'M8.5 5.5v13M15.5 5.5v13',
  play: 'M8 5.5v13l10-6.5-10-6.5Z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20.5a7.5 7.5 0 0 1 15 0',
  liftUp: 'M12 15V4.5M7.5 9 12 4.5 16.5 9M5 15.5v3a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5v-3',
  zzz: 'M5 6.5h5l-5 6h5M13 11.5h3.5l-3.5 4h3.5M17.5 4.5H20l-2.5 3H20',
  plane: 'M3.5 11.2 20.5 4l-6.8 16.5-3.2-6.7-7-2.6ZM10.5 13.8 20.5 4',
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  size?: number
  filled?: boolean
  className?: string
  style?: CSSProperties
}

const FILLABLE: ReadonlySet<IconName> = new Set(['star', 'heart', 'apple', 'moon', 'bolt', 'sparkle', 'play'])

export function Icon({ name, size = 24, filled = false, className, style }: IconProps) {
  const fill = filled && FILLABLE.has(name)
  return (
    <svg
      className={`icon${className ? ` ${className}` : ''}`}
      width={size} height={size} viewBox="0 0 24 24"
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={style}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
