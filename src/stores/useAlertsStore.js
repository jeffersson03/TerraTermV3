import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

// Alertas activas. La evaluación de reglas vive en features/alerts/utils (M4);
// el store solo guarda el resultado.
//
// Forma de cada alerta:
// { id, ruleId, severity: 'info' | 'warning' | 'critical', title, message,
//   variableId, location: { lat, lon, label }, value, threshold, meta }
export const useAlertsStore = create((set) => ({
  alerts: [],
  dismissedIds: [],

  setAlerts: (alerts) => set({ alerts }),

  dismiss: (alertId) =>
    set((state) => ({ dismissedIds: [...new Set([...state.dismissedIds, alertId])] })),

  clear: () => set({ alerts: [], dismissedIds: [] }),
}));

function selectVisibleAlerts(state) {
  return state.alerts.filter((alert) => !state.dismissedIds.includes(alert.id));
}

// Alertas visibles (no descartadas). useShallow es obligatorio: el filtro crea
// un array nuevo en cada llamada y, sin él, zustand v5 entra en un bucle de renders.
export function useVisibleAlerts() {
  return useAlertsStore(useShallow(selectVisibleAlerts));
}
