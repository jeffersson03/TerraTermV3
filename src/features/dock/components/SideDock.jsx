import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useDockStore } from "@/stores/useDockStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DOCK_PANELS, getDockTabs } from "@/features/dock/components/dockRegistry";

const EASE = [0.22, 1, 0.36, 1];
const PANEL_WIDTH = "28rem";
const SHEET_HEIGHT = "56%";

// Escritorio (lg): columna derecha que empuja el mapa.
// Móvil y tablet: panel DEBAJO del mapa (el mapa se encoge, no queda tapado).
const VARIANTS = {
  desktop: { initial: { width: 0, opacity: 0 }, animate: { width: PANEL_WIDTH, opacity: 1 }, exit: { width: 0, opacity: 0 } },
  stacked: { initial: { height: 0 }, animate: { height: SHEET_HEIGHT }, exit: { height: 0 } },
};

// Pestañas abajo: zona de fácil alcance con el pulgar en móvil.
function DockTabs({ tabs, activeTab, onSelect, onClose, isDesktop }) {
  const CloseIcon = isDesktop ? X : ChevronDown;
  return (
    <nav aria-label="Módulos" className="flex shrink-0 items-center gap-1 border-t border-hud-border bg-space-900/80 px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div role="tablist" className="flex min-w-0 flex-1 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls="side-dock-panel"
              onClick={() => onSelect(tab.id)}
              className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent sm:flex-row sm:gap-1.5 sm:text-xs ${
                isActive ? "bg-space-800 text-sensor-accent" : "text-ink-muted hover:bg-space-800/60 hover:text-ink"
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar panel"
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-space-800 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent"
      >
        <CloseIcon aria-hidden="true" className="size-5" />
      </button>
    </nav>
  );
}

// Panel único: un módulo a la vez (Zona · Tendencias · Asistente) con las pestañas abajo.
function SideDock({ level }) {
  const activeTab = useDockStore((state) => state.activeTab);
  const openTab = useDockStore((state) => state.openTab);
  const close = useDockStore((state) => state.close);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const tabs = getDockTabs(level);
  const current = tabs.find((tab) => tab.id === activeTab);
  const Content = current ? DOCK_PANELS[current.id] : null;

  return (
    <AnimatePresence initial={false}>
      {current && (
        <motion.aside
          id="side-dock"
          key={`side-dock-${isDesktop ? "desktop" : "stacked"}`}
          aria-label="Panel de análisis"
          {...(isDesktop ? VARIANTS.desktop : VARIANTS.stacked)}
          transition={{ duration: 0.4, ease: EASE }}
          className="relative z-30 flex w-full shrink-0 flex-col overflow-hidden border-t border-hud-border bg-space-950/95 backdrop-blur-md lg:w-auto lg:border-l lg:border-t-0"
        >
          <div className="flex h-full min-h-0 flex-col lg:w-[28rem]">
            <div
              id="side-dock-panel"
              role="tabpanel"
              className={`min-h-0 flex-1 ${current.scrollable ? "overflow-y-auto" : "flex flex-col"}`}
            >
              <Content />
            </div>
            <DockTabs tabs={tabs} activeTab={activeTab} onSelect={openTab} onClose={close} isDesktop={isDesktop} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SideDock;
