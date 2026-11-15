import { useMemo, useState } from "react";
import { TREND_RANGE_C_PER_DECADE } from "@/constants/palettes";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";
import { trendColor, trendOpacity } from "@/features/map2d/utils/trendColor";
import { formatSigned } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";

const COLLAPSED_ROWS = 8;
const KIND_TITLE_KEY = { land: "ranking.land", ocean: "ranking.ocean" };

// Barra divergente centrada en 0: hacia la derecha calienta, hacia la izquierda enfría.
function TrendBar({ trend }) {
  const [, max] = TREND_RANGE_C_PER_DECADE;
  const share = Math.min(1, Math.abs(trend.slopePerDecade) / max) * 50;
  const isWarming = trend.slopePerDecade >= 0;
  return (
    <span aria-hidden="true" className="relative h-2 w-full rounded-full bg-space-800">
      <span className="absolute inset-y-0 left-1/2 w-px bg-hud-border" />
      <span
        className="absolute inset-y-0 rounded-full"
        style={{
          [isWarming ? "left" : "right"]: "50%",
          width: `${share}%`,
          background: trendColor(trend.slopePerDecade),
          opacity: trendOpacity(trend),
        }}
      />
    </span>
  );
}

// Ranking térmico interactivo: zonas ordenadas por su tendencia real (°C/década).
// Tocar una fila la selecciona en el mapa (igual que tocar la zona): dos toques = comparación.
function TrendRanking() {
  const status = useTrendMapStore((state) => state.status);
  const trends = useTrendMapStore((state) => state.trends);
  const regions = useTrendMapStore((state) => state.regions);
  const period = useTrendMapStore((state) => state.period);
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);
  const toggleRegion = useExplorerStore((state) => state.toggleRegion);
  const sensor = getSensor(useTelemetryStore((state) => state.domain));
  const [kind, setKind] = useState("land");
  const [expanded, setExpanded] = useState(false);
  const { t, locale } = useT();

  // La vista decide qué se puede seleccionar: Terra solo tierra, Aqua solo mar.
  const kinds = sensor.selectableKinds;
  const activeKind = kinds.includes(kind) ? kind : kinds[0];

  const rows = useMemo(
    () =>
      regions
        .filter((region) => region.kind === activeKind && trends.get(region.id)?.trend.slopePerDecade != null)
        .map((region) => ({ region, trend: trends.get(region.id).trend }))
        .sort((a, b) => b.trend.slopePerDecade - a.trend.slopePerDecade),
    [regions, trends, activeKind]
  );

  if (status === "loading") return <p className="animate-pulse text-xs text-ink-muted">{t("ranking.loading")}</p>;
  if (status !== "ready" || rows.length === 0) return null;

  const selectedById = new Map(selectedRegions.map((region) => [region.id, region]));
  const visible = expanded ? rows : rows.slice(0, COLLAPSED_ROWS);

  return (
    <section aria-label={t("ranking.title")} className="flex flex-col gap-2">
      <header className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] uppercase tracking-wider text-ink-secondary">
          {t("ranking.title")}{period ? ` ${period.from}–${period.to}` : ""}
        </h3>
        {kinds.length > 1 && (
          <div role="group" aria-label={t("ranking.kind")} className="flex rounded-md border border-hud-border p-0.5">
            {kinds.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === activeKind}
                onClick={() => setKind(option)}
                className={`rounded px-2 py-1 text-[11px] ${option === activeKind ? "bg-space-800 text-sensor-accent" : "text-ink-muted hover:text-ink"}`}
              >
                {t(KIND_TITLE_KEY[option])}
              </button>
            ))}
          </div>
        )}
      </header>
      <p className="text-[11px] text-ink-muted">{t("ranking.hint")}</p>

      <ol className="flex flex-col">
        {visible.map(({ region, trend }) => {
          const selected = selectedById.get(region.id);
          return (
            <li key={region.id}>
              <button
                type="button"
                data-sensor={selected?.sensorId}
                aria-pressed={Boolean(selected)}
                onClick={() => toggleRegion(region)}
                className={`grid min-h-11 w-full grid-cols-[minmax(0,7.5rem)_1fr_4.25rem] items-center gap-3 rounded-md px-2 text-left transition-colors hover:bg-space-800/70 focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent ${
                  selected ? "bg-space-800 ring-1 ring-sensor-accent/60" : ""
                }`}
              >
                <span className="truncate text-xs text-ink">
                  {selected && <span className="mr-1 font-mono text-sensor-accent">{selected.marker}</span>}
                  {regionDisplayLabel(region, t)}
                </span>
                <TrendBar trend={trend} />
                <span className={`text-right font-mono text-xs tabular-nums ${trend.isSignificant ? "text-ink" : "text-ink-muted"}`}>
                  {formatSigned(trend.slopePerDecade, 2, locale)}
                  {trend.isSignificant && <span className="text-sensor-accent">*</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between gap-2 text-[10px] text-ink-muted">
        <span>{t("ranking.footer")}</span>
        {rows.length > COLLAPSED_ROWS && (
          <button type="button" onClick={() => setExpanded((value) => !value)} className="min-h-9 px-2 text-xs text-sensor-accent hover:underline">
            {expanded ? t("ranking.showLess") : t("ranking.showAll", { count: rows.length })}
          </button>
        )}
      </div>
    </section>
  );
}

export default TrendRanking;
