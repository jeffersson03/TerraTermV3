import { Menu, X } from "lucide-react";
import { useDockStore } from "@/stores/useDockStore";
import { getDefaultDockTab } from "@/features/dock/components/dockRegistry";

// Botón hamburguesa: abre el dock lateral (Zona · Tendencias · Asistente) o lo cierra.
// Con el dock abierto en tablet/escritorio se oculta: el dock trae su propio botón de cierre.
function DockToggle({ level, className = "" }) {
  const activeTab = useDockStore((state) => state.activeTab);
  const openTab = useDockStore((state) => state.openTab);
  const close = useDockStore((state) => state.close);
  const isOpen = activeTab !== null;
  const Icon = isOpen ? X : Menu;

  return (
    <button
      type="button"
      onClick={() => (isOpen ? close() : openTab(getDefaultDockTab(level)))}
      aria-label={isOpen ? "Cerrar panel" : "Abrir panel: zona, tendencias y asistente"}
      aria-expanded={isOpen}
      aria-controls="side-dock"
      className={`${isOpen ? "flex sm:hidden" : "flex"} size-10 items-center justify-center rounded-md border border-hud-border bg-space-900/90 text-ink-secondary shadow-lg shadow-black/40 backdrop-blur-md transition-colors hover:border-sensor-accent/60 hover:text-sensor-accent focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent ${className}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}

export default DockToggle;
