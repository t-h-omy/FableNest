/** Logische Koordinaten des Spielzimmers. Die Zeichenfläche skaliert per CSS, Platzierungen beziehen sich immer auf diese Größe. */
export const ROOM_LAYOUT = {
  width: 640,
  height: 480,
  floorY: 350,
  creature: { x: 320, y: 292, scale: 1.15 },
  window: { x: 56, y: 56, width: 112, height: 124 },
  shelf: { x: 410, y: 196, width: 140 },
} as const
