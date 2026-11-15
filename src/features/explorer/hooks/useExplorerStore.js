import { create } from "zustand";
import { isStepAvailable } from "@/features/explorer/constants/explorerSteps";

const MAX_SELECTION = 2;
// Zona A usa los colores de Terra (ámbar) y la B los de Aqua (cian)
const SLOTS = [
  { marker: "A", sensorId: "terra" },
  { marker: "B", sensorId: "aqua" },
];
const NOTICE_MS = 3500;

// Asigna marcador y color según la posición en la selección
function withSlots(regions) {
  return regions.map((region, index) => ({ ...region, ...SLOTS[index] }));
}

// Paso natural según cuántas zonas hay seleccionadas
function stepForSelection(selection) {
  return ["country", "cell", "compare"][selection.length];
}

let noticeTimer = null;

// Estado del explorador: nivel (globo / país), país activo, zonas
// seleccionadas (máx. 2) y paso del panel. Store local del módulo.
export const useExplorerStore = create((set, get) => ({
  level: "globe", // 'globe' | 'country'
  countryId: null,
  selectedRegions: [], // regiones de map2d/utils/regionModel.js + marker + sensorId
  stepId: "country",
  notice: null, // aviso breve en el HUD

  enterCountry: (countryId) => set({ level: "country", countryId, selectedRegions: [], stepId: "country" }),

  // Conserva countryId para volar de vuelta desde ese país
  exitToGlobe: () => set({ level: "globe", selectedRegions: [], stepId: "country" }),

  // Clic en una zona: si ya está, se quita; si hay 2, la nueva reemplaza a B
  toggleRegion: (region) => {
    const current = get().selectedRegions;
    const exists = current.some((item) => item.id === region.id);
    let next;
    if (exists) next = current.filter((item) => item.id !== region.id);
    else if (current.length < MAX_SELECTION) next = [...current, region];
    else next = [current[0], region];

    const selection = withSlots(next);
    set({ selectedRegions: selection, stepId: stepForSelection(selection) });
  },

  setSelection: (regions) => {
    const selection = withSlots(regions.slice(0, MAX_SELECTION));
    set({ selectedRegions: selection, stepId: stepForSelection(selection) });
  },

  // Quita las zonas que la vista activa ya no permite (p. ej. océano en Terra)
  pruneSelection: (allowedKinds) => {
    const current = get().selectedRegions;
    const kept = current.filter((region) => allowedKinds.includes(region.kind));
    if (kept.length === current.length) return;
    const selection = withSlots(kept);
    set({ selectedRegions: selection, stepId: stepForSelection(selection) });
  },

  clearSelection: () => set({ selectedRegions: [], stepId: "country" }),

  goToStep: (stepId) => {
    if (isStepAvailable(stepId, get().selectedRegions)) set({ stepId });
  },

  showNotice: (text) => {
    clearTimeout(noticeTimer);
    set({ notice: text });
    noticeTimer = setTimeout(() => set({ notice: null }), NOTICE_MS);
  },
}));
