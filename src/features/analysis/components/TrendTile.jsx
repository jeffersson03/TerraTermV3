import SignificanceBadge from "@/features/analysis/components/SignificanceBadge";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";
import { formatSigned } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Tendencia de una región: pendiente de Sen por década + significancia.
// Toma el color de la región (`data-sensor`), igual que su marcador en el globo.
function TrendTile({ region, variable, trend, isLoading, size = "md" }) {
  const { t, tc, locale } = useT();
  const valueClass = size === "lg" ? "text-5xl sm:text-6xl" : "text-3xl";

  return (
    <div data-sensor={region.sensorId} className="relative rounded-sm border border-hud-border bg-space-900/70 p-3">
      <p className="text-xs text-ink-secondary">
        <span className="mr-1 font-mono text-sensor-accent">{region.marker}</span>
        {regionDisplayLabel(region, t)}
      </p>

      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
        <span className={`font-mono font-semibold tabular-nums text-sensor-accent ${valueClass} ${isLoading ? "animate-pulse opacity-40" : ""}`}>
          {isLoading ? "—" : formatSigned(trend?.slopePerDecade, 2, locale)}
        </span>
        <span className="text-xs text-ink-secondary">
          {t("trend.perDecade", { unit: tc("variables", variable.id, "unit", variable.unit) })}
        </span>
      </p>

      <div className="mt-2 min-h-[1.5rem]">{!isLoading && <SignificanceBadge trend={trend} />}</div>
    </div>
  );
}

export default TrendTile;
