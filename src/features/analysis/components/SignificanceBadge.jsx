import { formatPValue } from "@/utils/formatValues";

// Resultado de la prueba de Mann-Kendall en lenguaje claro, con su p-valor.
function SignificanceBadge({ trend }) {
  if (!trend?.isReliable) {
    return <span className="text-[11px] text-ink-muted">Serie corta: sin conclusión ({trend?.n ?? 0} años)</span>;
  }

  return (
    <span
      title="Prueba de Mann-Kendall, nivel de confianza 95 %"
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
        trend.isSignificant ? "border-sensor-accent/50 bg-sensor-glow text-sensor-accent" : "border-hud-border text-ink-secondary"
      }`}
    >
      {trend.isSignificant ? "Tendencia significativa" : "No significativa"}
      <span className="font-mono tabular-nums opacity-80">p {formatPValue(trend.pValue)}</span>
    </span>
  );
}

export default SignificanceBadge;
