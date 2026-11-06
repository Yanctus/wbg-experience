import { useI18n } from '../../i18n/useI18n'
import a11y from '../../styles/a11y.module.css'

interface CountUpProps {
  value: number
  decimals?: number
}

/**
 * Zahl, die beim Sichtbarwerden hochzählt (useProfileAnimation liest `data-count`).
 *
 * React rendert immer den Endwert: Ohne JavaScript-Animation, bei reduzierter
 * Bewegung und für Screenreader steht die richtige Zahl da. Der animierte Text
 * ist `aria-hidden`, damit Screenreader nicht „0, 1, 2 …“ vorlesen, sondern den
 * Endwert aus der unsichtbaren Kopie.
 */
export function CountUp({ value, decimals = 0 }: CountUpProps) {
  const { formatNumber } = useI18n()
  const text = formatNumber(value, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <>
      <span aria-hidden="true" data-count data-value={value} data-decimals={decimals}>
        {text}
      </span>
      <span className={a11y.srOnly}>{text}</span>
    </>
  )
}
