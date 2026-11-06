import { useI18n } from '../../i18n/useI18n'
import {
  CORNERS,
  DOOR_PATHS,
  FURNITURE,
  LEFT_TICKS,
  ORIGIN,
  ROOMS,
  SCALE,
  SEGMENTS,
  TOP_TICKS,
  VIEWBOX,
  WINDOW_LINES,
  px,
  py,
  type RoomId,
} from './floorPlan'
import styles from './FloorPlan.module.css'

interface FloorPlanProps {
  highlighted: RoomId | null
  onHover: (id: RoomId | null) => void
  onSelect: (id: RoomId) => void
}

/** Architektur-typischer Maßstrich: kurze Schrägstrich-Marke auf der Maßlinie. */
const tick = (x: number, y: number) => `M${x - 3} ${y + 3}L${x + 3} ${y - 3}`

/**
 * Der Grundriss als Zeichnung. Er ist rein dekorativ (`aria-hidden`): Die
 * Bedienung für Tastatur und Screenreader läuft über das Raumbuch daneben.
 * Mit der Maus lassen sich die Räume aber auch direkt im Plan berühren.
 *
 * Die Zeichen-Animation (Striche werden gezogen) steuert useProfileAnimation
 * über die `data-draw`/`data-marker`/`data-fade`-Attribute.
 */
export function FloorPlan({ highlighted, onHover, onSelect }: FloorPlanProps) {
  const { formatNumber } = useI18n()
  const dimension = (meters: number) =>
    formatNumber(meters, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const x0 = px(0)
  const x1 = px(10)
  const y0 = py(0)
  const y1 = py(7)

  const topChainY = 40
  const topTotalY = 20
  const leftChainX = 48
  const leftTotalX = 28

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      aria-hidden="true"
      focusable="false"
      data-plan
    >
      {/* Räume: einzige Elemente, die Mausereignisse annehmen. */}
      <g>
        {ROOMS.map((room) => (
          <rect
            key={room.id}
            className={styles.room}
            data-on={highlighted === room.id ? '' : undefined}
            x={px(room.x)}
            y={py(room.y)}
            width={room.w * SCALE}
            height={room.h * SCALE}
            onPointerEnter={() => onHover(room.id)}
            onPointerLeave={() => onHover(null)}
            onClick={() => onSelect(room.id)}
          />
        ))}
      </g>

      <g pointerEvents="none">
        {/* Möbel */}
        <g className={styles.furniture}>
          {FURNITURE.map((item, index) =>
            item.shape === 'rect' ? (
              <rect
                key={index}
                data-draw="detail"
                x={px(item.x)}
                y={py(item.y)}
                width={item.w * SCALE}
                height={item.h * SCALE}
                rx={item.r ?? 0}
              />
            ) : (
              <circle
                key={index}
                data-draw="detail"
                cx={px(item.cx)}
                cy={py(item.cy)}
                r={item.r * SCALE}
              />
            ),
          )}
        </g>

        {/* Wände */}
        <g>
          {SEGMENTS.map((segment, index) => (
            <line
              key={index}
              data-draw="wall"
              className={segment.kind === 'outer' ? styles.outer : styles.inner}
              x1={segment.x1}
              y1={segment.y1}
              x2={segment.x2}
              y2={segment.y2}
            />
          ))}
          {CORNERS.map(([cx, cy]) => (
            <rect
              key={`${cx}-${cy}`}
              data-fade
              className={styles.corner}
              x={cx - 3.5}
              y={cy - 3.5}
              width="7"
              height="7"
            />
          ))}
        </g>

        {/* Fenster und Türen */}
        <g>
          {WINDOW_LINES.map((line, index) => (
            <line key={index} data-draw="detail" className={styles.window} {...line} />
          ))}
          {DOOR_PATHS.map((door, index) => (
            <g key={index}>
              <path data-draw="detail" className={styles.doorLeaf} d={door.leaf} />
              <path data-draw="detail" className={styles.doorArc} d={door.arc} />
            </g>
          ))}
        </g>

        {/* Bemaßung: Teilmaße unten, Gesamtmaß darüber; links entsprechend. */}
        <g className={styles.dims}>
          <line data-draw="dim" x1={x0} y1={topChainY} x2={x1} y2={topChainY} />
          <line data-draw="dim" x1={x0} y1={topTotalY} x2={x1} y2={topTotalY} />
          {TOP_TICKS.map((m) => (
            <g key={`t${m}`}>
              <line
                data-draw="dim"
                x1={px(m)}
                y1={m === 0 || m === 10 ? topTotalY - 6 : topChainY - 6}
                x2={px(m)}
                y2={y0 - 6}
              />
              <path data-draw="dim" d={tick(px(m), topChainY)} />
              {(m === 0 || m === 10) && <path data-draw="dim" d={tick(px(m), topTotalY)} />}
            </g>
          ))}
          {TOP_TICKS.slice(1).map((m, i) => (
            <text
              key={`tl${m}`}
              data-fade
              className={styles.dimText}
              x={(px(TOP_TICKS[i]) + px(m)) / 2}
              y={topChainY - 5}
              textAnchor="middle"
            >
              {dimension(m - TOP_TICKS[i])}
            </text>
          ))}
          <text
            data-fade
            className={styles.dimText}
            x={(x0 + x1) / 2}
            y={topTotalY - 5}
            textAnchor="middle"
          >
            {dimension(10)}
          </text>

          <line data-draw="dim" x1={leftChainX} y1={y0} x2={leftChainX} y2={y1} />
          <line data-draw="dim" x1={leftTotalX} y1={y0} x2={leftTotalX} y2={y1} />
          {LEFT_TICKS.map((m) => (
            <g key={`l${m}`}>
              <line
                data-draw="dim"
                x1={m === 0 || m === 7 ? leftTotalX - 6 : leftChainX - 6}
                y1={py(m)}
                x2={x0 - 6}
                y2={py(m)}
              />
              <path data-draw="dim" d={tick(leftChainX, py(m))} />
              {(m === 0 || m === 7) && <path data-draw="dim" d={tick(leftTotalX, py(m))} />}
            </g>
          ))}
          {LEFT_TICKS.slice(1).map((m, i) => (
            <text
              key={`ll${m}`}
              data-fade
              className={styles.dimText}
              transform={`translate(${leftChainX - 5} ${(py(LEFT_TICKS[i]) + py(m)) / 2}) rotate(-90)`}
              textAnchor="middle"
            >
              {dimension(m - LEFT_TICKS[i])}
            </text>
          ))}
          <text
            data-fade
            className={styles.dimText}
            transform={`translate(${leftTotalX - 5} ${(y0 + y1) / 2}) rotate(-90)`}
            textAnchor="middle"
          >
            {dimension(7)}
          </text>

          {/* Nordpfeil */}
          <circle data-draw="dim" cx="505" cy="96" r="14" />
          <polygon data-draw="dim" className={styles.north} points="505,84 510,102 505,98 500,102" />
          <text data-fade className={styles.dimText} x="505" y="72" textAnchor="middle">
            N
          </text>

          {/* Maßstabsleiste: 2 m */}
          <rect className={styles.scaleFill} data-fade x={ORIGIN.x} y="366" width={SCALE} height="4" />
          <rect data-draw="dim" x={ORIGIN.x + SCALE} y="366" width={SCALE} height="4" />
          {[0, 1, 2].map((m) => (
            <text
              key={m}
              data-fade
              className={styles.dimText}
              x={ORIGIN.x + m * SCALE}
              y="384"
              textAnchor="middle"
            >
              {m}
            </text>
          ))}
          <text data-fade className={styles.dimText} x={ORIGIN.x + 2 * SCALE + 12} y="384">
            m
          </text>
        </g>

        {/* Nummernmarken */}
        <g>
          {ROOMS.map((room, index) => (
            <g
              key={room.id}
              className={styles.marker}
              data-marker
              data-on={highlighted === room.id ? '' : undefined}
              transform={`translate(${px(room.marker[0])} ${py(room.marker[1])})`}
            >
              <circle className={styles.markerCircle} r="11" />
              <text className={styles.markerText}>{index + 1}</text>
            </g>
          ))}
        </g>
      </g>
    </svg>
  )
}
