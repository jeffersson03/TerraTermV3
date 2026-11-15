import { Bot, ChartLine, MapPinned } from "lucide-react";
import FlowPanel from "@/features/explorer/components/FlowPanel";
import AnalysisPanel from "@/features/analysis/components/AnalysisPanel";
import AssistantChat from "@/features/assistant/components/AssistantChat";

// Registro de pestañas del dock. Módulo nuevo = crear su componente y añadirlo aquí.
//   levels:     en qué nivel del explorador está disponible ('globe' | 'country')
//   scrollable: true → el dock hace scroll; false → el contenido gestiona su propio alto (chat)
// En el globo solo existe el asistente (se abre con el robot); en el mapa 2D, las tres pestañas.
export const DOCK_TABS = Object.freeze([
  { id: "zone", labelKey: "dock.zone", icon: MapPinned, levels: ["country"], scrollable: true },
  { id: "trends", labelKey: "dock.trends", icon: ChartLine, levels: ["country"], scrollable: true },
  { id: "assistant", labelKey: "dock.assistant", icon: Bot, levels: ["globe", "country"], scrollable: false },
]);

// Componente de cada pestaña (acceso directo por id: componentes estáticos para React).
export const DOCK_PANELS = Object.freeze({
  zone: FlowPanel,
  trends: AnalysisPanel,
  assistant: AssistantChat,
});

export function getDockTabs(level) {
  return DOCK_TABS.filter((tab) => tab.levels.includes(level));
}

export function isTabAvailable(tabId, level) {
  return DOCK_TABS.some((tab) => tab.id === tabId && tab.levels.includes(level));
}
