import { create } from "zustand";

// Ubicación SELECCIONADA, destino de la cámara y regiones resaltadas en el globo.
// No guarda la vista activa (eso es useTelemetryStore) ni el hover (useHoverStore).
//
// Escriben: M1 Globo (clic), M3 Filtros (búsqueda), M5 Asistente (SET_LOCATION),
//           explorador (features/explorer: vuelo al país).
// Leen: todos los módulos.
export const useMapStore = create((set) => ({
  selectedLocation: null, // { lat, lon, label } | null
  cameraTarget: null, // { lat, lon, distance? } | null — el globo vuela hasta aquí
  highlightedRegionIds: [], // ids de src/constants/regions.js dibujados en el globo

  // Selecciona una ubicación y, por defecto, mueve la cámara hacia ella
  setLocation: (location, { fly = true } = {}) =>
    set(fly ? { selectedLocation: location, cameraTarget: location } : { selectedLocation: location }),

  flyTo: (target) => set({ cameraTarget: target }),

  clearLocation: () => set({ selectedLocation: null }),

  setHighlightedRegions: (regionIds) => set({ highlightedRegionIds: regionIds }),
}));
