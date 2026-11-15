import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useMapStore } from "@/stores/useMapStore";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { getCountry } from "@/constants/countries";

// Resumen pequeño de lo que el usuario está viendo, para que el asistente responda con contexto.
// Solo LEE los stores (getState); no los modifica. Las acciones sobre el mapa (mapActions.js) quedan para otra fase.
export function buildAssistantContext() {
  const explorer = useExplorerStore.getState();
  const filters = useFiltersStore.getState();
  const map = useMapStore.getState();
  const telemetry = useTelemetryStore.getState();

  return {
    view: explorer.level === "country" ? "mapa 2D del país" : "globo 3D",
    country: getCountry(explorer.countryId)?.name ?? null,
    selectedRegions: explorer.selectedRegions.map((region) => region.name ?? region.label ?? region.id),
    sensor: telemetry.domain ?? null,
    variableId: filters.variableId ?? null,
    period: filters.period ?? null,
    selectedLocation: map.selectedLocation ?? null,
  };
}
