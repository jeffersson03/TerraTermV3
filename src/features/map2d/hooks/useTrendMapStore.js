import { create } from "zustand";

// Estado del mapa de tendencia térmica real del mapa 2D (store local del módulo).
// Lo escribe useTrendMap (dentro de CountryMap2D); lo leen la leyenda y la sonda.
//   key      → país + periodo de la tendencia mostrada
//   status   → 'idle' | 'loading' | 'ready' | 'error'
//   progress → mosaicos descargados { done, total }
//   trends   → Map(regionId → { trend, annual, pointCount })
export const useTrendMapStore = create((set) => ({
  key: null,
  status: "idle",
  progress: { done: 0, total: 0 },
  trends: new Map(),
  period: null,
  error: null,
  attempt: 0,

  start: (key, period) => set({ key, period, status: "loading", progress: { done: 0, total: 0 }, trends: new Map(), error: null }),
  setProgress: (progress) => set({ progress }),
  finish: (trends) => set({ status: "ready", trends }),
  fail: (error) => set({ status: "error", error }),
  retry: () => set((state) => ({ attempt: state.attempt + 1 })),
}));
