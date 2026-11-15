import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useDockStore } from "@/stores/useDockStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { DOCK_PANELS, getDockTabs } from "@/features/dock/components/dockRegistry";

const EASE = [0.22, 1, 0.36, 1];
const PANEL_WIDTH = "28rem";

// Escritorio (lg): columna derecha que empuja el mapa.
// Tablet (sm–lg): panel superpuesto a la derecha. Móvil: hoja inferior.
const VARIANTS = {
  desktop: { initial: { width: 0, opacity: 0 }, animate: { width: PANEL_WIDTH, opacity: 1 }, exit: { width: 0, opacity: 0 } },
  tablet: { initial: { x: "100%" }, animate: { x: 0 }, exit: { x: "100%" } },
  mobile: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
};

// Panel lateral único: un módulo a la vez (Zona · Tendencias · Asistente) con pestañas arriba.
function SideDock({ level }) {
  const activeTab = useDockStore((state) => state.activeTab);
  const openTab = useDockStore((state) => state.openTab);
  const close = useDockStore((state) => state.close);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const isTablet = useMediaQuery("(min-width: 640px)");

  const tabs = getDockTabs(level);
  const current = tabs.find((tab) => tab.id === activeTab);
  const Content = current ? DOCK_PANELS[current.id] : null;
  const variants = isDesktop ? VARIANTS.desktop : isTablet ? VARIANTS.tablet : VARIANTS.mobile;

  return (
    <AnimatePresence initial={false}>
      {current && (
        <motion.aside
          id="side-dock"
          key="side-dock"
          aria-label="Panel lateral"
          {...variants}
          transition={{ duration: 0.4, ease: EASE }}
          className="absolute inset-x-0 bottom-0 z-30 flex h-[75%] flex-col overflow-hidden rounded-t-xl border-t border-hud-border bg-space-950/95 shadow-2xl shadow-black/60 backdrop-blur-md sm:inset-y-0 sm:left-auto sm:right-0 sm:h-auto sm:w-[26rem] sm:rounded-none sm:border-l sm:border-t-0 lg:static lg:shrink-0 lg:shadow-none"
        >
          <div className="flex h-full min-h-0 flex-col lg:w-[28rem]">
            {/* Asa de la hoja (solo móvil) */}
            <span aria-hidden="true" className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-hud-border sm:hidden" />

            <nav aria-label="Módulos" className="flex shrink-0 items-center gap-1 border-b border-hud-border px-2 py-2">
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
                      onClick={() => openTab(tab.id)}
                      className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 font-mono text-xs uppercase tracking-wider transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent ${
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
                onClick={close}
                aria-label="Cerrar panel"
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-space-800 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </nav>

            <div
              id="side-dock-panel"
              role="tabpanel"
              className={`min-h-0 flex-1 ${current.scrollable ? "overflow-y-auto" : "flex flex-col"}`}
            >
              <Content />
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SideDock;
