import TimeSeriesChart from "@/components/charts/TimeSeriesChart";

// Registro de tipos de gráfico. Para añadir uno (barras de anomalía,
// dispersión, mapa de calor…): crear el componente en src/components/charts/
// y registrarlo aquí. Los paneles solo usan <ChartBlock type="…" />.
// Uso: `const Chart = CHART_TYPES[type]`.
export const CHART_TYPES = Object.freeze({
  timeSeries: TimeSeriesChart,
});
