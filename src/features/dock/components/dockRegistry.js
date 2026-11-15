import { Bot, ChartLine, MapPinned } from "lucide-react";
import FlowPanel from "@/features/explorer/components/FlowPanel";
import AnalysisPanel from "@/features/analysis/components/AnalysisPanel";
import AssistantChat from "@/features/assistant/components/AssistantChat";

// Registro de pestañas del dock lateral. Módulo nuevo = crear su componente y añadirlo aquí.
//   levels:     en qué nivel del explorador está disponible ('globe' | 'country')
//   scrollable: true → el dock hace scroll; false → el contenido gestiona su propio alto (chat)
export const DOCK_TABS = Object.freeze([
  { id: "zone", label: "Zona", icon: MapPinned, levels: ["country"], scrollable: true },
  { id: "trends", label: "Tendencias", icon: ChartLine, levels: ["globe", "country"], scrollable: true },
  { id: "assistant", label: "Asistente", icon: Bot, levels: ["globe", "country"], scrollable: false },
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

// Pestaña que abre la hamburguesa: el panel de zona en el país, el análisis en el globo.
export function getDefaultDockTab(level) {
  return level === "country" ? "zone" : "trends";
}
