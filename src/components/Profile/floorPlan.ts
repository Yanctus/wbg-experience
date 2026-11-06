import type { MessageKey } from '../../i18n/messages'

/**
 * Geometrie der Beispielwohnung (Grundriss, 70 m²).
 *
 * Alle Maße sind in Metern angegeben, Ursprung = linke obere Außenecke.
 * Daraus entstehen Wandsegmente (mit Lücken für Türen/Fenster), Türschwenkbögen
 * und die Raumflächen — Flächen und Zeichnung können sich also nicht widersprechen.
 */

export type RoomId = 'living' | 'kitchen' | 'bedroom' | 'kids' | 'bath' | 'hall'

/** Pixel pro Meter in der SVG-Zeichnung. */
export const SCALE = 40
export const ORIGIN = { x: 70, y: 58 }
export const VIEWBOX = { w: 540, h: 400 }

export const px = (meters: number) => ORIGIN.x + meters * SCALE
export const py = (meters: number) => ORIGIN.y + meters * SCALE

const round1 = (n: number) => Math.round(n * 10) / 10

export interface Room {
  id: RoomId
  messageKey: MessageKey
  x: number
  y: number
  w: number
  h: number
  /** Position der Nummernmarke (m). */
  marker: readonly [number, number]
  /** m², auf eine Nachkommastelle gerundet. */
  area: number
}

/** Reihenfolge = Nummerierung in Plan und Raumbuch. */
const ROOM_DEFS = [
  { id: 'living', messageKey: 'room.living', x: 6, y: 0, w: 4, h: 4.5, marker: [8, 2.25] },
  { id: 'kitchen', messageKey: 'room.kitchen', x: 6, y: 4.5, w: 4, h: 2.5, marker: [8, 5.75] },
  { id: 'bedroom', messageKey: 'room.bedroom', x: 0, y: 0, w: 3.5, h: 3.8, marker: [1.75, 1.9] },
  { id: 'kids', messageKey: 'room.kids', x: 0, y: 3.8, w: 3.5, h: 3.2, marker: [1.75, 5.4] },
  { id: 'bath', messageKey: 'room.bath', x: 3.5, y: 0, w: 2.5, h: 2.4, marker: [4.75, 1.2] },
  { id: 'hall', messageKey: 'room.hall', x: 3.5, y: 2.4, w: 2.5, h: 4.6, marker: [4.75, 4.6] },
] as const satisfies readonly Omit<Room, 'area'>[]

export const ROOMS: readonly Room[] = ROOM_DEFS.map((room) => ({
  ...room,
  area: round1(room.w * room.h),
}))

export const TOTAL_AREA = round1(ROOMS.reduce((sum, room) => sum + room.area, 0))

/* ------------------------------------------------------------------ Wände */

type GapKind = 'window' | 'door' | 'opening'

interface Gap {
  /** Anfang und Ende der Lücke entlang der Wand (m). */
  from: number
  to: number
  kind: GapKind
}

interface WallDef {
  x1: number
  y1: number
  x2: number
  y2: number
  kind: 'outer' | 'inner'
  gaps?: readonly Gap[]
}

const WALLS: readonly WallDef[] = [
  // Außenwände
  {
    x1: 0, y1: 0, x2: 10, y2: 0, kind: 'outer',
    gaps: [
      { from: 1, to: 2.6, kind: 'window' }, // Schlafzimmer
      { from: 4.3, to: 5.2, kind: 'window' }, // Bad
      { from: 7, to: 9.2, kind: 'window' }, // Wohnen
    ],
  },
  {
    x1: 10, y1: 0, x2: 10, y2: 7, kind: 'outer',
    gaps: [
      { from: 1, to: 3.2, kind: 'window' }, // Wohnen
      { from: 5.2, to: 6.2, kind: 'window' }, // Küche
    ],
  },
  {
    x1: 0, y1: 7, x2: 10, y2: 7, kind: 'outer',
    gaps: [
      { from: 1, to: 2.6, kind: 'window' }, // Kinderzimmer
      { from: 4.3, to: 5.1, kind: 'door' }, // Wohnungstür
      { from: 7.4, to: 8.8, kind: 'window' }, // Küche
    ],
  },
  {
    x1: 0, y1: 0, x2: 0, y2: 7, kind: 'outer',
    gaps: [
      { from: 1, to: 2.8, kind: 'window' }, // Schlafzimmer
      { from: 4.5, to: 6.1, kind: 'window' }, // Kinderzimmer
    ],
  },
  // Innenwände
  {
    x1: 3.5, y1: 0, x2: 3.5, y2: 7, kind: 'inner',
    gaps: [
      { from: 2.6, to: 3.4, kind: 'door' }, // Flur → Schlafzimmer
      { from: 4.4, to: 5.2, kind: 'door' }, // Flur → Kinderzimmer
    ],
  },
  {
    x1: 6, y1: 0, x2: 6, y2: 7, kind: 'inner',
    gaps: [
      { from: 3.3, to: 4.1, kind: 'door' }, // Flur → Wohnen
      { from: 5.3, to: 6.1, kind: 'door' }, // Flur → Küche
    ],
  },
  { x1: 3.5, y1: 2.4, x2: 6, y2: 2.4, kind: 'inner', gaps: [{ from: 4.2, to: 5, kind: 'door' }] }, // Bad
  { x1: 0, y1: 3.8, x2: 3.5, y2: 3.8, kind: 'inner' },
  { x1: 6, y1: 4.5, x2: 10, y2: 4.5, kind: 'inner', gaps: [{ from: 6.9, to: 8.7, kind: 'opening' }] },
]

export interface Segment {
  x1: number
  y1: number
  x2: number
  y2: number
  kind: 'outer' | 'inner'
}

/** Zerlegt jede Wand in die massiven Stücke zwischen den Lücken (Pixel). */
function buildSegments(): Segment[] {
  const segments: Segment[] = []

  for (const wall of WALLS) {
    const horizontal = wall.y1 === wall.y2
    const start = horizontal ? wall.x1 : wall.y1
    const end = horizontal ? wall.x2 : wall.y2
    const gaps = [...(wall.gaps ?? [])].sort((a, b) => a.from - b.from)

    const push = (from: number, to: number) => {
      if (to - from < 0.001) return
      segments.push(
        horizontal
          ? { x1: px(from), y1: py(wall.y1), x2: px(to), y2: py(wall.y2), kind: wall.kind }
          : { x1: px(wall.x1), y1: py(from), x2: px(wall.x2), y2: py(to), kind: wall.kind },
      )
    }

    let cursor = start
    for (const gap of gaps) {
      push(cursor, gap.from)
      cursor = gap.to
    }
    push(cursor, end)
  }
  return segments
}

export const SEGMENTS: readonly Segment[] = buildSegments()

/** Die vier Außenecken als Quadrate, damit die Wände dort sauber schließen. */
export const CORNERS: readonly (readonly [number, number])[] = [
  [px(0), py(0)],
  [px(10), py(0)],
  [px(0), py(7)],
  [px(10), py(7)],
]

/* ---------------------------------------------------------------- Fenster */

export interface Line {
  x1: number
  y1: number
  x2: number
  y2: number
}

/** Fensterzeichen: drei parallele Linien in der Wandstärke. */
function buildWindowLines(): Line[] {
  const lines: Line[] = []
  for (const wall of WALLS) {
    if (wall.kind !== 'outer') continue
    const horizontal = wall.y1 === wall.y2
    for (const gap of wall.gaps ?? []) {
      if (gap.kind !== 'window') continue
      for (const offset of [-2.5, 0, 2.5]) {
        lines.push(
          horizontal
            ? { x1: px(gap.from), y1: py(wall.y1) + offset, x2: px(gap.to), y2: py(wall.y1) + offset }
            : { x1: px(wall.x1) + offset, y1: py(gap.from), x2: px(wall.x1) + offset, y2: py(gap.to) },
        )
      }
    }
  }
  return lines
}

export const WINDOW_LINES: readonly Line[] = buildWindowLines()

/* ------------------------------------------------------------------ Türen */

type Point = readonly [number, number]

interface DoorDef {
  /** Drehpunkt, Spitze des geöffneten Türblatts und gegenüberliegender Pfosten (m). */
  hinge: Point
  leaf: Point
  jamb: Point
}

const DOORS: readonly DoorDef[] = [
  { hinge: [4.3, 7], leaf: [4.3, 6.2], jamb: [5.1, 7] }, // Wohnungstür
  { hinge: [4.2, 2.4], leaf: [4.2, 3.2], jamb: [5, 2.4] }, // Bad
  { hinge: [3.5, 2.6], leaf: [2.7, 2.6], jamb: [3.5, 3.4] }, // Schlafzimmer
  { hinge: [3.5, 5.2], leaf: [2.7, 5.2], jamb: [3.5, 4.4] }, // Kinderzimmer
  { hinge: [6, 3.3], leaf: [6.8, 3.3], jamb: [6, 4.1] }, // Wohnen
  { hinge: [6, 6.1], leaf: [6.8, 6.1], jamb: [6, 5.3] }, // Küche
]

export interface DoorPath {
  leaf: string
  arc: string
}

/**
 * Türblatt als Linie, Schwenkbereich als Viertelkreis um den Drehpunkt.
 * Das Vorzeichen des Kreuzprodukts entscheidet, in welche Richtung der Bogen
 * läuft (SVG: sweep-flag 1 = im Uhrzeigersinn, y-Achse zeigt nach unten).
 */
function buildDoorPath({ hinge, leaf, jamb }: DoorDef): DoorPath {
  const [hx, hy] = [px(hinge[0]), py(hinge[1])]
  const [lx, ly] = [px(leaf[0]), py(leaf[1])]
  const [jx, jy] = [px(jamb[0]), py(jamb[1])]
  const radius = Math.hypot(lx - hx, ly - hy)
  const cross = (lx - hx) * (jy - hy) - (ly - hy) * (jx - hx)
  const sweep = cross > 0 ? 1 : 0
  return {
    leaf: `M${hx} ${hy}L${lx} ${ly}`,
    arc: `M${lx} ${ly}A${radius} ${radius} 0 0 ${sweep} ${jx} ${jy}`,
  }
}

export const DOOR_PATHS: readonly DoorPath[] = DOORS.map(buildDoorPath)

/* ------------------------------------------------------------------ Möbel */

export type Furniture =
  | { shape: 'rect'; x: number; y: number; w: number; h: number; r?: number }
  | { shape: 'circle'; cx: number; cy: number; r: number }

export const FURNITURE: readonly Furniture[] = [
  // Schlafzimmer: Doppelbett mit Kissen, Schrank
  { shape: 'rect', x: 0.7, y: 0.15, w: 1.8, h: 2, r: 2 },
  { shape: 'rect', x: 0.82, y: 0.27, w: 0.7, h: 0.4, r: 3 },
  { shape: 'rect', x: 1.68, y: 0.27, w: 0.7, h: 0.4, r: 3 },
  { shape: 'rect', x: 0.15, y: 3.2, w: 2.2, h: 0.45 },
  // Kinderzimmer: Bett, Schreibtisch
  { shape: 'rect', x: 0.2, y: 3.95, w: 0.9, h: 2, r: 2 },
  { shape: 'rect', x: 1.9, y: 6.25, w: 1.4, h: 0.6 },
  // Bad: Wanne, WC, Waschbecken
  { shape: 'rect', x: 3.65, y: 0.15, w: 0.75, h: 1.7, r: 8 },
  { shape: 'rect', x: 5.35, y: 0.2, w: 0.45, h: 0.65, r: 6 },
  { shape: 'rect', x: 5.3, y: 1.35, w: 0.55, h: 0.45, r: 4 },
  // Flur: Schuhschrank
  { shape: 'rect', x: 5.6, y: 4.2, w: 0.25, h: 1 },
  // Wohnen: Sofa, Couchtisch, Esstisch
  { shape: 'rect', x: 6.15, y: 0.5, w: 0.8, h: 2.2, r: 4 },
  { shape: 'rect', x: 7.4, y: 1, w: 1, h: 1 },
  { shape: 'circle', cx: 8.4, cy: 3.25, r: 0.55 },
  // Küche: Zeile, Kühlschrank
  { shape: 'rect', x: 6.9, y: 6.35, w: 2.95, h: 0.6 },
  { shape: 'rect', x: 9.35, y: 4.6, w: 0.6, h: 0.6 },
]

/* ------------------------------------------------------------- Bemaßung */

/** Teilungen der Maßketten (m): oben entlang der Breite, links entlang der Tiefe. */
export const TOP_TICKS = [0, 3.5, 6, 10] as const
export const LEFT_TICKS = [0, 3.8, 7] as const
