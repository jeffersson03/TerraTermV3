import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_THEME } from "@/components/charts/chartTheme";
import { formatNumber } from "@/utils/formatValues";

/**
 * Serie temporal multi-línea.
 * @param {Array<object>} data   filas [{ year, <key>: valor, ... }]
 * @param {Array<{ key, label, color }>} series  una entrada por línea
 * @param {string} xKey          campo del eje X (por defecto 'year')
 * @param {string} unit
 */
function TimeSeriesChart({ data, series, xKey = "year", unit, height = 200, ariaLabel }) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
          <CartesianGrid stroke={CHART_THEME.grid} vertical={false} />
          <XAxis dataKey={xKey} tick={CHART_THEME.tick} stroke={CHART_THEME.axis} tickLine={false} minTickGap={24} />
          <YAxis
            tick={CHART_THEME.tick}
            stroke={CHART_THEME.axis}
            tickLine={false}
            width={48}
            tickFormatter={(value) => formatNumber(value)}
            domain={["auto", "auto"]}
          />
          <Tooltip
            {...CHART_THEME.tooltip}
            formatter={(value, name) => [`${formatNumber(value, 2)} ${unit ?? ""}`, name]}
          />
          {series.map((item) => (
            <Line
              key={item.key}
              dataKey={item.key}
              name={item.label}
              stroke={item.color}
              strokeWidth={1.75}
              dot={false}
              connectNulls={false}
              animationDuration={CHART_THEME.animationMs}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TimeSeriesChart;
