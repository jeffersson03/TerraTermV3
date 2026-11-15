import { formatPValue } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Resultado de la prueba de Mann-Kendall en lenguaje claro, con su p-valor.
function SignificanceBadge({ trend }) {
  const { t, locale } = useT();
  if (!trend?.isReliable) {
    return <span className="text-[11px] text-ink-muted">{t("significance.short", { years: trend?.n ?? 0 })}</span>;
  }

  return (
    <span
      title={t("significance.test")}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] ${
        trend.isSignificant ? "border-sensor-accent/50 bg-sensor-glow text-sensor-accent" : "border-hud-border text-ink-secondary"
      }`}
    >
      {trend.isSignificant ? t("significance.yes") : t("significance.no")}
      <span className="font-mono tabular-nums opacity-80">p {formatPValue(trend.pValue, locale)}</span>
    </span>
  );
}

export default SignificanceBadge;
