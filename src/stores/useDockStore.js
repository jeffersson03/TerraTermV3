import { create } from "zustand";

// Panel lateral único (dock): muestra UN módulo a la vez para que no se superpongan.
// activeTab: null (cerrado) | 'zone' (panel del explorador) | 'trends' (análisis) | 'assistant' (chat IA)
// Escriben: ExplorerPage (hamburguesa, entrada/salida de país), robot del asistente. Leen: layout y dock.
export const useDockStore = create((set) => ({
  activeTab: null,

  openTab: (tab) => set({ activeTab: tab }),

  close: () => set({ activeTab: null }),
}));
