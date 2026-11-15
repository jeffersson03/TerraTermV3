import { create } from "zustand";

// Arranque de la app: qué piezas pesadas ya están listas.
// Lo usa la intro (features/intro) para salir solo cuando el globo puede mostrarse.
// Escribe: useGlobeTextures (texturas cargadas). Lee: IntroSplash.
export const useBootStore = create((set) => ({
  isGlobeReady: false,

  setGlobeReady: () => set({ isGlobeReady: true }),
}));
