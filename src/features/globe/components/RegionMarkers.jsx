import { useMapStore } from "@/stores/useMapStore";
import { getRegion } from "@/constants/regions";
import RegionMarker from "@/features/globe/components/RegionMarker";

// Dibuja las regiones resaltadas en useMapStore. Quien decide qué se resalta
// (flujo guiado, filtros, asistente) solo escribe en el store.
function RegionMarkers({ radius }) {
  const highlightedRegionIds = useMapStore((state) => state.highlightedRegionIds);

  return highlightedRegionIds
    .map(getRegion)
    .filter(Boolean)
    .map((region) => <RegionMarker key={region.id} region={region} radius={radius} />);
}

export default RegionMarkers;
