import { useMemo } from "react";
import { useEnvironmentalData } from "@/hooks/useEnvironmentalData";
import { toAnnualMeans } from "@/features/analysis/utils/aggregateSeries";
import { analyzeTrend } from "@/features/analysis/utils/trendStats";

/**
 * Serie anual + tendencia de una variable en una región (objeto con `center`).
 * Devuelve el contrato común de datos más `annual` y `trend`.
 * Hoy usa el punto central; con datos por área (Giovanni / AppEEARS) el
 * servicio podrá usar `region.bbox` sin cambiar este hook.
 */
export function useRegionTrend({ region, variableId, period }) {
  const query = useEnvironmentalData({ variableId, location: region?.center ?? null, period });

  const annual = useMemo(() => toAnnualMeans(query.data), [query.data]);
  const trend = useMemo(() => analyzeTrend(annual), [annual]);

  // Vacío también si hay datos pero ningún año con cobertura suficiente
  const hasNoUsableYears = Boolean(query.data) && annual.length === 0;
  return { ...query, annual, trend, isEmpty: query.isEmpty || hasNoUsableYears };
}
