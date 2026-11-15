import { useMemo } from "react";
import ChartBlock from "@/components/charts/ChartBlock";
import StatTile from "@/components/Hud/StatTile";
import VariableChips from "@/features/filters/components/VariableChips";
import PeriodChips from "@/features/filters/components/PeriodChips";
import { useRegionTrend } from "@/features/analysis/hooks/useRegionTrend";
import { analyzeCorrelation, toStandardAnomalies } from "@/features/analysis/utils/correlation";
import { mergeByYear } from "@/features/analysis/utils/aggregateSeries";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { combineStates } from "@/features/explorer/components/panels/combineStates";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";
import { getSensor } from "@/constants/sensors";
import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { formatPValue, formatSigned } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Clave de i18n que describe el resultado de la correlación
function correlationKey(result) {
  if (!result.isReliable) return "correlation.insufficient";
  if (!result.isSignificant) return "correlation.notSignificant";
  return result.r > 0 ? "correlation.positive" : "correlation.negative";
}

const OCEAN_VARIABLE_ID = "sst";

// Comparación tierra vs. océano (vista Classic): correlación entre la anomalía
// de temperatura del mar y la anomalía de la variable en tierra (forzante → respuesta).
function CorrelationPanel() {
  const { regions, period } = useSelectionContext();
  const ocean = regions.find((region) => region.kind === "ocean");
  const land = regions.find((region) => region.kind === "land");
  const selectedVariableId = useFiltersStore((state) => state.variableId);
  const landVariable = getVariable(land?.variables.includes(selectedVariableId) ? selectedVariableId : land?.variables[0]);
  const oceanVariable = getVariable(OCEAN_VARIABLE_ID);
  const { t, tc, locale } = useT();

  const oceanQuery = useRegionTrend({ region: ocean, variableId: oceanVariable.id, period });
  const landQuery = useRegionTrend({ region: land, variableId: landVariable?.id, period });
  const oceanKey = ocean?.id ?? "ocean";
  const landKey = land?.id ?? "land";

  const { chartData, result } = useMemo(() => {
    const oceanZ = toStandardAnomalies(oceanQuery.annual);
    const landZ = toStandardAnomalies(landQuery.annual);
    return {
      chartData: mergeByYear({ [oceanKey]: oceanZ, [landKey]: landZ }),
      result: analyzeCorrelation(oceanZ, landZ),
    };
  }, [oceanQuery.annual, landQuery.annual, oceanKey, landKey]);

  // Durante la animación de salida la selección puede haber cambiado ya
  if (!ocean || !land || !landVariable) return null;

  const variableText = (variable, field) => tc("variables", variable.id, field, variable[field]);
  const oceanName = regionDisplayLabel(ocean, t);
  const landName = regionDisplayLabel(land, t);
  const series = [
    { key: ocean.id, label: `${ocean.marker} · ${variableText(oceanVariable, "shortLabel")}`, color: getSensor(ocean.sensorId).accent },
    { key: land.id, label: `${land.marker} · ${variableText(landVariable, "shortLabel")}`, color: getSensor(land.sensorId).accent },
  ];
  const state = combineStates(oceanQuery, landQuery);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink">{t("correlation.title")}</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {t("correlation.subtitle", {
            oceanVariable: variableText(oceanVariable, "label"),
            ocean: oceanName,
            landVariable: variableText(landVariable, "label").toLowerCase(),
            land: landName,
          })}
        </p>
      </header>

      <VariableChips variableIds={land.variables} />
      <PeriodChips />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label={t("correlation.r")} value={state.isLoading ? null : result.r} decimals={2} />
        <div className="flex flex-col gap-1 rounded-sm border border-hud-border bg-space-900/70 p-3">
          <span className="text-[11px] uppercase tracking-wider text-ink-secondary">{t("correlation.pValue")}</span>
          <p className="font-mono text-xl tabular-nums text-ink">{state.isLoading ? "—" : formatPValue(result.pValue, locale)}</p>
        </div>
      </div>
      {!state.isLoading && (
        <p role="status" className="text-xs text-ink-secondary">
          {t(correlationKey(result))} <span className="font-mono text-ink-muted">(n = {result.n}, r = {formatSigned(result.r, 2, locale)})</span>
        </p>
      )}

      <ChartBlock
        title={t("correlation.chartTitle")}
        type="timeSeries"
        state={state}
        meta={landQuery.meta}
        actions={<span className="font-mono text-[10px] text-ink-muted">σ</span>}
        chartProps={{ data: chartData, series, unit: "σ", height: 190, ariaLabel: t("correlation.chartAria") }}
      />

      <p className="text-[11px] text-ink-muted">{t("correlation.causality")}</p>
    </div>
  );
}

export default CorrelationPanel;
