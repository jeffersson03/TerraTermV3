import { create } from "zustand";
import { DEFAULT_VARIABLE_ID } from "@/constants/variables";
import { DEFAULT_PERIOD_PRESET } from "@/constants/periods";

const MAX_COMPARE_LOCATIONS = 3;

function isSamePlace(a, b) {
  return a.lat === b.lat && a.lon === b.lon;
}

// Qué se consulta: variable, periodo y ubicaciones a comparar.
// Escriben: M3 Filtros, M5 Asistente. Leen: M1, M2, M4.
export const useFiltersStore = create((set) => ({
  variableId: DEFAULT_VARIABLE_ID,
  // { start: 'YYYY-MM-DD', end: 'YYYY-MM-DD' }. Por defecto un periodo largo:
  // las tendencias necesitan ≥ 10 años (ver src/constants/periods.js)
  period: DEFAULT_PERIOD_PRESET.period,
  compareLocations: [], // [{ lat, lon, label }] (máx. 3)

  setVariable: (variableId) => set({ variableId }),

  setPeriod: (period) => set({ period }),

  addCompare: (location) =>
    set((state) => {
      const exists = state.compareLocations.some((item) => isSamePlace(item, location));
      if (exists || state.compareLocations.length >= MAX_COMPARE_LOCATIONS) return state;
      return { compareLocations: [...state.compareLocations, location] };
    }),

  removeCompare: (location) =>
    set((state) => ({
      compareLocations: state.compareLocations.filter((item) => !isSamePlace(item, location)),
    })),
}));
