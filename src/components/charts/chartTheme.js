// Estilo común de todos los gráficos (Recharts). Valores tomados de los tokens
// de src/styles/theme.css; Recharts necesita colores literales en algunos props.
export const CHART_THEME = Object.freeze({
  grid: "rgba(148, 163, 184, 0.12)", // --color-hud-border (más tenue)
  axis: "#475569", // --color-ink-muted
  tick: { fill: "#94a3b8", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }, // --color-ink-secondary
  tooltip: {
    contentStyle: {
      background: "rgba(11, 19, 34, 0.95)", // --color-space-900
      border: "1px solid rgba(148, 163, 184, 0.18)",
      borderRadius: 2,
      fontFamily: "JetBrains Mono, monospace",
      fontSize: 11,
    },
    labelStyle: { color: "#f1f5f9" }, // --color-ink
  },
  animationMs: 600,
});
