import { useCallback, useEffect, useRef } from "react";
import { geoBounds, geoCentroid } from "d3-geo";
import { getCountry } from "@/constants/countries";
import { useMapStore } from "@/stores/useMapStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { t } from "@/i18n/useT";

const ENTER_DELAY_MS = 900; // tiempo de vuelo antes del fundido al 2D
const WORLD_DISTANCE = 3.2;
const MIN_DISTANCE = 1.3;

// Distancia de cámara para que el país llene la vista (según su extensión)
function distanceForFeature(feature, lat) {
  const [[west, south], [east, north]] = geoBounds(feature);
  const lonSpan = east >= west ? east - west : east + 360 - west; // cruza el antimeridiano
  const span = Math.max(north - south, lonSpan * Math.cos((lat * Math.PI) / 180));
  return Math.min(WORLD_DISTANCE, Math.max(MIN_DISTANCE, 1 + span * 0.035));
}

// Entrada y salida del mapa 2D: vuela al país y, si está habilitado, cambia
// al nivel "country" tras el vuelo. Al salir, la cámara se aleja desde ahí.
export function useCountryEntry() {
  const flyTo = useMapStore((state) => state.flyTo);
  const enterCountry = useExplorerStore((state) => state.enterCountry);
  const exitToGlobe = useExplorerStore((state) => state.exitToGlobe);
  const showNotice = useExplorerStore((state) => state.showNotice);
  const timerRef = useRef(null);
  const lastCenterRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCountryClick = useCallback(
    (feature) => {
      const [lon, lat] = geoCentroid(feature);
      lastCenterRef.current = { lat, lon };
      flyTo({ lat, lon, distance: distanceForFeature(feature, lat) });

      const country = getCountry(feature.id);
      clearTimeout(timerRef.current);
      if (!country) {
        // El aviso se guarda ya traducido: dura unos segundos (NOTICE_MS)
        showNotice(t("notice.noMap", { country: feature.properties?.name ?? t("notice.thisCountry") }));
        return;
      }
      timerRef.current = setTimeout(() => enterCountry(country.id), ENTER_DELAY_MS);
    },
    [flyTo, enterCountry, showNotice]
  );

  const handleExit = useCallback(() => {
    clearTimeout(timerRef.current);
    exitToGlobe();
    if (lastCenterRef.current) flyTo({ ...lastCenterRef.current, distance: WORLD_DISTANCE });
  }, [exitToGlobe, flyTo]);

  return { handleCountryClick, handleExit };
}
