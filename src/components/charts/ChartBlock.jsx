import HudPanel from "@/components/Hud/HudPanel";
import DataState from "@/components/Hud/DataState";
import SourceBadge from "@/components/Hud/SourceBadge";
import { CHART_TYPES } from "@/components/charts/chartRegistry";

/**
 * Bloque de gráfico estándar: panel + estados de datos + gráfico + procedencia.
 * Todos los gráficos de la app se muestran con este componente.
 *
 * <ChartBlock title="Series anuales" type="timeSeries" state={query} meta={meta}
 *             chartProps={{ data, series, unit }} />
 *
 * `state`: { isLoading, error, isEmpty, isStale, retry } (contrato de los hooks de datos)
 */
function ChartBlock({ title, type, state, meta, chartProps, actions }) {
  const Chart = CHART_TYPES[type] ?? null;

  return (
    <HudPanel title={title} actions={actions}>
      <DataState {...state}>
        {Chart ? <Chart {...chartProps} /> : <p className="text-xs text-ink-muted">Tipo de gráfico no registrado: {type}</p>}
        <SourceBadge meta={meta} className="mt-2" />
      </DataState>
    </HudPanel>
  );
}

export default ChartBlock;
