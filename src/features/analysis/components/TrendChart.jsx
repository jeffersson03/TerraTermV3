import { useEffect, useRef, useState } from 'react'
import { format } from '../utils/format.js'
import { useT } from '@/i18n/useT'

const seriesColors = ['var(--color-terra-400)', 'var(--color-aqua-400)']

function scaleValues(values) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || Math.max(Math.abs(max) * 0.1, 1)
  const rough = range / 4
  const order = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].find(size => size * order >= rough) * order
  const low = Math.floor((min - 0.12 * range) / step) * step
  const high = Math.ceil((max + 0.12 * range) / step) * step
  const ticks = Array.from({ length: Math.round((high - low) / step) + 1 }, (_, i) => low + i * step)
  const digits = Math.max(0, -Math.floor(Math.log10(step)))
  return { low, high, ticks, digits }
}

function observedPath(points, x, y) {
  return points.map(({ year, value }, index) => {
    const continuous = index > 0 && year === points[index - 1].year + 1
    return `${continuous ? 'L' : 'M'}${x(year)},${y(value)}`
  }).join(' ')
}

export default function TrendChart({ series, from, to, unit }) {
  const { t } = useT()
  const frame = useRef(null)
  const [width, setWidth] = useState(480)

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setWidth(Math.max(230, Math.floor(entry.contentRect.width)))
    })
    observer.observe(frame.current)
    return () => observer.disconnect()
  }, [])

  const values = series.flatMap(({ points, trend }) =>
    [...points, ...(trend.fit ?? [])].map(({ value }) => value),
  )
  const height = 248
  const left = 46
  const right = 20
  const top = 23
  const bottom = 26
  const plotWidth = width - left - right
  const x = year => to === from ? left + plotWidth / 2 : left + (year - from) * plotWidth / (to - from)
  const tickCount = Math.min(to - from + 1, width < 360 ? 4 : 5)
  const ticks = Array.from({ length: tickCount }, (_, i) => (
    tickCount === 1 ? from : Math.round(from + i * (to - from) / (tickCount - 1))
  ))

  return (
    <figure ref={frame} aria-labelledby="trend-chart-title" className="min-w-0">
      <figcaption id="trend-chart-title" className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-semibold">{t('analysis.chart.title')}</span>
        <span className="text-xs text-ink-secondary">{t('analysis.chart.key')}</span>
      </figcaption>
      {values.length ? (
        <AnnualPlot
          series={series} unit={unit} from={from} to={to} width={width} height={height}
          left={left} right={right} top={top} bottom={bottom} values={values} x={x} ticks={ticks}
        />
      ) : (
        <p className="rounded-lg border border-hud-border p-4 text-sm text-ink-secondary">{t('analysis.chart.empty')}</p>
      )}
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-secondary" aria-label={t('analysis.chart.seriesLabel')}>
        {series.map(({ id, label }, i) => (
          <li key={id} className="flex items-center gap-2">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: seriesColors[i] }} />
            {label}
          </li>
        ))}
      </ul>
      {values.length > 0 && <AnnualValues series={series} unit={unit} />}
    </figure>
  )
}

function AnnualPlot({ series, unit, from, to, width, height, left, right, top, bottom, values, x, ticks }) {
  const { t, locale } = useT()
  const scale = scaleValues(values)
  const y = value => top + (scale.high - value) * (height - top - bottom) / (scale.high - scale.low)
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%" height={height} role="img"
      aria-label={t('analysis.chart.aria', { unit, from, to })}
      className="block rounded-lg bg-space-950/65"
    >
      <text x={left - 6} y={15} textAnchor="end" className="fill-ink-secondary text-xs">{unit}</text>
      {scale.ticks.map(value => (
        <g key={value}>
          <line x1={left} x2={width - right} y1={y(value)} y2={y(value)} className="stroke-hud-border" />
          <text x={left - 6} y={y(value) + 4} textAnchor="end" className="fill-ink-secondary text-xs">
            {format(value, scale.digits, locale)}
          </text>
        </g>
      ))}
      {ticks.map(year => (
        <text key={year} x={x(year)} y={height - 6} textAnchor="middle" className="fill-ink-secondary text-xs">
          {year}
        </text>
      ))}
      {series.map(({ id, points, trend, label }, i) => (
        <g key={id} stroke={seriesColors[i]} data-series={id}>
          <path d={observedPath(points, x, y)} fill="none" opacity="0.8" strokeWidth="1.5" />
          {trend.fit && (
            <line
              x1={x(trend.fit[0].year)} y1={y(trend.fit[0].value)}
              x2={x(trend.fit[1].year)} y2={y(trend.fit[1].value)}
              strokeWidth="2" strokeDasharray="5 4"
            />
          )}
          {points.map(({ year, value }) => (
            <circle key={year} cx={x(year)} cy={y(value)} r="2.7" fill={seriesColors[i]}>
              <title>{label} · {year} · {format(value, 2, locale)} {unit}</title>
            </circle>
          ))}
        </g>
      ))}
    </svg>
  )
}

function AnnualValues({ series, unit }) {
  const { t, locale } = useT()
  return (
    <details className="mt-3 text-xs text-ink-secondary">
      <summary className="cursor-pointer text-ink">{t('analysis.chart.values')}</summary>
      <table className="mt-2 w-full table-fixed text-left tabular-nums">
        <thead>
          <tr className="border-b border-hud-border">
            <th scope="col" className="w-14 py-2">{t('analysis.chart.year')}</th>
            {series.map(({ id, label }) => <th key={id} scope="col" className="py-2 pr-1">{label} ({unit})</th>)}
          </tr>
        </thead>
        <tbody>
          {series[0].points.map(({ year }, index) => (
            <tr key={year} className="border-b border-hud-border">
              <th scope="row" className="py-1.5 font-normal">{year}</th>
              {series.map(({ id, points }) => <td key={id}>{format(points[index].value, 2, locale)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  )
}
