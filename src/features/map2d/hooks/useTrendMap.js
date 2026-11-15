import { useEffect } from "react";
import { fetchPowerRegionalMonthly } from "@/services/nasa/powerRegionalService";
import { powerCoverage } from "@/services/nasa/powerService";
import { computeRegionTrends } from "@/features/map2d/utils/trendGrid";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";

// Parámetro térmico: TS de MERRA-2 = temperatura de la superficie (tierra) o del mar (océano).
export const TREND_PARAMETER = "TS";

// Años del periodo de filtros, limitados a la cobertura de NASA POWER.
export function periodYears(period) {
  const from = Math.max(Number(period.start.slice(0, 4)), powerCoverage.from);
  const to = Math.min(Number(period.end.slice(0, 4)), powerCoverage.to);
  return { from, to };
}

/**
 * Descarga la rejilla regional de NASA POWER (TS) del área visible y calcula la tendencia
 * térmica real de cada departamento y celda de mar. Cambia con el país y el periodo.
 * El resultado queda en useTrendMapStore (lo leen el mapa, la leyenda y la sonda).
 */
export function useTrendMap({ regions, period }) {
  const attempt = useTrendMapStore((state) => state.attempt);
  const isReady = regions.status === "ready";
  const countryId = regions.country?.id;
  const { from, to } = periodYears(period);

  useEffect(() => {
    if (!isReady) return;
    const key = `${countryId}|${from}|${to}|${attempt}`;
    const store = useTrendMapStore.getState();
    if (store.key === key && store.status !== "error") return; // ya calculado o en curso

    store.start(key, { from, to });
    const isCurrent = () => useTrendMapStore.getState().key === key;

    fetchPowerRegionalMonthly({
      bbox: regions.viewBbox,
      parameter: TREND_PARAMETER,
      from,
      to,
      onProgress: (done, total) => isCurrent() && useTrendMapStore.getState().setProgress({ done, total }),
    })
      .then((points) => {
        if (!isCurrent()) return;
        const allRegions = [...regions.landRegions, ...regions.oceanRegions];
        useTrendMapStore.getState().finish(computeRegionTrends(allRegions, points, from, to), allRegions);
      })
      .catch((error) => {
        if (isCurrent()) useTrendMapStore.getState().fail(error);
      });
  }, [isReady, countryId, from, to, attempt, regions]);
}
