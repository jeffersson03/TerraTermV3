import { create } from "zustand";

// Precisión con la que se muestran las coordenadas (2 decimales ≈ 1 km).
const PRECISION = 100;

function roundCoord(value) {
  return Math.round(value * PRECISION) / PRECISION;
}

function isSameHover(a, b) {
  return (
    a && b && a.lat === b.lat && a.lon === b.lon && a.country === b.country && a.regionId === b.regionId && a.screenX === b.screenX && a.screenY === b.screenY
  );
}

// Estado del puntero sobre el globo o el mapa 2D. Store separado a propósito:
// cambia hasta ~60 veces por segundo, así que solo deben suscribirse
// componentes pequeños (HoverProbe, CountryBorders), nunca paneles grandes.
export const useHoverStore = create((set, get) => ({
  // { lat, lon, country, regionId, screenX, screenY } | null
  // screenX/Y = posición del puntero en la ventana (clientX/clientY), para la sonda
  // regionId  = zona del mapa 2D bajo el cursor (null en el globo)
  hoveredLocation: null,
  hoveredFeature: null, // Feature GeoJSON del país bajo el cursor (globo) | null

  setHoveredLocation: ({ lat, lon, country, regionId = null, screenX = null, screenY = null }) => {
    const next = { lat: roundCoord(lat), lon: roundCoord(lon), country, regionId, screenX, screenY };
    if (isSameHover(get().hoveredLocation, next)) return;
    set({ hoveredLocation: next });
  },

  setHoveredFeature: (feature) => {
    if (get().hoveredFeature !== feature) set({ hoveredFeature: feature });
  },

  clearHover: () => {
    const { hoveredLocation, hoveredFeature } = get();
    if (hoveredLocation !== null || hoveredFeature !== null) {
      set({ hoveredLocation: null, hoveredFeature: null });
    }
  },
}));
