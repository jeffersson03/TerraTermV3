import { Layers } from "lucide-react";
import HudButton from "@/components/Hud/HudButton";
import SourceBadge from "@/components/Hud/SourceBadge";
import DataState from "@/components/Hud/DataState";
import TrendTile from "@/features/analysis/components/TrendTile";
import TrendRanking from "@/features/map2d/components/TrendRanking";
import VariableChips from "@/features/filters/components/VariableChips";
import { useRegionTrend } from "@/features/analysis/hooks/useRegionTrend";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { formatLatitude, formatLongitude } from "@/utils/formatCoordinates";
import { formatPeriod } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";

// Paso "Celda": la primera zona seleccionada, su tendencia y su fuente.
function CellPanel() {
  const { regions, period } = useSelectionContext();
  const region = regions[0];
  const goToStep = useExplorerStore((state) => state.goToStep);
  const selectedVariableId = useFiltersStore((state) => state.variableId);
  const variableId = region?.variables.includes(selectedVariableId) ? selectedVariableId : region?.variables[0];
  const variable = variableId ? getVariable(variableId) : null;
  const query = useRegionTrend({ region, variableId, period });
  const { t, locale } = useT();

  // Durante la animación de salida la selección puede haber cambiado ya
  if (!region || !variable) return null;

  return (
    <div data-sensor={region.sensorId} className="flex flex-col gap-4">
      <header>
        <p className="font-mono text-xs text-sensor-accent">{t("cell.zone", { marker: region.marker })}</p>
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{regionDisplayLabel(region, t)}</h2>
        <p className="mt-1 font-mono text-xs tabular-nums text-ink-muted">
          {formatLatitude(region.center.lat, locale)} · {formatLongitude(region.center.lon, locale)}
        </p>
      </header>

      <VariableChips variableIds={region.variables} />
      <p className="font-mono text-xs text-ink-muted">{formatPeriod(period, locale)}</p>

      <DataState {...query}>
        <TrendTile region={region} variable={variable} trend={query.trend} size="lg" />
        <SourceBadge meta={query.meta} className="mt-3" />
      </DataState>

      {regions.length < 2 && <p className="text-xs text-ink-muted">{t("cell.pickAnother")}</p>}
      {regions.length < 2 && <TrendRanking />}

      {region.kind === "land" && (
        <HudButton variant="ghost" icon={Layers} onClick={() => goToStep("city")} className="self-start">
          {t("cell.urbanDetail")}
        </HudButton>
      )}
    </div>
  );
}

export default CellPanel;
