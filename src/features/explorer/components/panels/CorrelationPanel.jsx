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
import { getSensor } from "@/constants/sensors";
import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { formatPValue, formatSigned } from "@/utils/formatValues";

const OCEAN_VARIABLE_ID = "sst";

function describeCorrelation(result) {
  if (!result.isReliable) return "Datos insuficientes (se necesitan ≥ 10 años comunes).";
  if (!result.isSignificant) return "Sin relación estadísticamente significativa en este periodo.";
  return result.r > 0
    ? "Relación significativa positiva: años con mar más cálido coinciden con más lluvia/calor en tierra."
    : "Relación significativa negativa: años con mar más cálido coinciden con menos lluvia/calor en tierra.";
}

// Comparación tierra vs. océano (vista Classic): correlación entre la anomalía
// de temperatura del mar y la anomalía de la variable en tierra (forzante → respuesta).
function CorrelationPanel() {
  const { regions, period } = useSelectionContext();
  const ocean = regions.find((region) => region.kind === "ocean");
  const land = regions.find((region) => region.kind === "land");
  const selectedVariableId = useFiltersStore((state) => state.variableId);
  const landVariable = getVariable(land?.variables.includes(selectedVariableId) ? selectedVariableId : land?.variables[0]);
  const oceanVariable = getVariable(OCEAN_VARIABLE_ID);

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

  const series = [
    { key: ocean.id, label: `${ocean.marker} · ${oceanVariable.shortLabel}`, color: getSensor(ocean.sensorId).accent },
    { key: land.id, label: `${land.marker} · ${landVariable.shortLabel}`, color: getSensor(land.sensorId).accent },
  ];
  const state = combineStates(oceanQuery, landQuery);

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink">Océano → tierra</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          {oceanVariable.label} en {ocean.label} vs. {landVariable.label.toLowerCase()} en {land.label}
        </p>
      </header>

      <VariableChips variableIds={land.variables} />
      <PeriodChips />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Correlación (r)" value={state.isLoading ? null : result.r} decimals={2} />
        <div className="flex flex-col gap-1 rounded-sm border border-hud-border bg-space-900/70 p-3">
          <span className="text-[11px] uppercase tracking-wider text-ink-secondary">p-valor</span>
          <p className="font-mono text-xl tabular-nums text-ink">{state.isLoading ? "—" : formatPValue(result.pValue)}</p>
        </div>
      </div>
      {!state.isLoading && (
        <p role="status" className="text-xs text-ink-secondary">
          {describeCorrelation(result)} <span className="font-mono text-ink-muted">(n = {result.n}, r = {formatSigned(result.r)})</span>
        </p>
      )}

      <ChartBlock
        title="Anomalías estandarizadas"
        type="timeSeries"
        state={state}
        meta={landQuery.meta}
        actions={<span className="font-mono text-[10px] text-ink-muted">σ</span>}
        chartProps={{ data: chartData, series, unit: "σ", height: 190, ariaLabel: "Anomalías estandarizadas del océano y de la tierra por año" }}
      />

      <p className="text-[11px] text-ink-muted">Correlación no implica causalidad: indica que ambas series varían juntas.</p>
    </div>
  );
}

export default CorrelationPanel;
