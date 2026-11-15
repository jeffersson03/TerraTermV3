import { useMemo } from "react";
import ChartBlock from "@/components/charts/ChartBlock";
import TrendTile from "@/features/analysis/components/TrendTile";
import DipoleVerdict from "@/features/analysis/components/DipoleVerdict";
import { useRegionTrend } from "@/features/analysis/hooks/useRegionTrend";
import { mergeByYear, toAnomalies } from "@/features/analysis/utils/aggregateSeries";
import { getSensor } from "@/constants/sensors";
import { combineStates } from "@/features/explorer/components/panels/combineStates";

// Bloque reutilizable: tendencias de dos regiones, veredicto de dipolo y
// series anuales como ANOMALÍAS (climas muy distintos se comparan mejor así).
// Lo usan los pasos "Comparar" y "Periodo".
function RegionComparison({ regions, variable, period }) {
  const [regionA, regionB] = regions;
  const queryA = useRegionTrend({ region: regionA, variableId: variable.id, period });
  const queryB = useRegionTrend({ region: regionB, variableId: variable.id, period });

  const chartData = useMemo(
    () => mergeByYear({ [regionA.id]: toAnomalies(queryA.annual), [regionB.id]: toAnomalies(queryB.annual) }),
    [regionA.id, regionB.id, queryA.annual, queryB.annual]
  );

  const series = [regionA, regionB].map((region) => ({
    key: region.id,
    label: `${region.marker} · ${region.label}`,
    color: getSensor(region.sensorId).accent,
  }));

  const isLoading = queryA.isLoading || queryB.isLoading;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TrendTile region={regionA} variable={variable} trend={queryA.trend} isLoading={queryA.isLoading} />
        <TrendTile region={regionB} variable={variable} trend={queryB.trend} isLoading={queryB.isLoading} />
      </div>

      <DipoleVerdict trendA={queryA.trend} trendB={queryB.trend} isLoading={isLoading} />

      <ChartBlock
        title="Anomalía anual"
        type="timeSeries"
        state={combineStates(queryA, queryB)}
        meta={queryA.meta}
        actions={<span className="font-mono text-[10px] text-ink-muted">{variable.unit}</span>}
        chartProps={{
          data: chartData,
          series,
          unit: variable.unit,
          height: 190,
          ariaLabel: `Anomalía anual de ${variable.label.toLowerCase()} en ${regionA.label} y ${regionB.label}`,
        }}
      />
    </div>
  );
}

export default RegionComparison;
