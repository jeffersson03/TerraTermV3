import { create } from "zustand";
import { DEFAULT_SENSOR_ID, SENSOR_ORDER } from "@/constants/sensors";

// Única fuente de verdad del dominio/vista activa (classic | terra | aqua).
export const useTelemetryStore = create((set) => ({
  domain: DEFAULT_SENSOR_ID,
  setDomain: (domain) => set({ domain }),
  cycleDomain: () =>
    set((state) => {
      const nextIndex = (SENSOR_ORDER.indexOf(state.domain) + 1) % SENSOR_ORDER.length;
      return { domain: SENSOR_ORDER[nextIndex] };
    }),
}));
