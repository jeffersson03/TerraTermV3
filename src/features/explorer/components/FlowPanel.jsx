import { AnimatePresence, motion } from "framer-motion";
import { PANELS, resolvePanelId } from "@/features/explorer/components/panelRegistry";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";

const PANEL_WIDTH = "28rem";
const EASE = [0.22, 1, 0.36, 1];

// Escritorio: columna derecha que se abre empujando el mapa.
// Móvil: hoja inferior sobre el mapa.
const CONTAINER_VARIANTS = {
  desktop: { initial: { width: 0, opacity: 0 }, animate: { width: PANEL_WIDTH, opacity: 1 }, exit: { width: 0, opacity: 0 } },
  mobile: { initial: { y: "100%" }, animate: { y: 0 }, exit: { y: "100%" } },
};

// Panel lateral del explorador. Solo existe en el mapa 2D del país; el
// contenido cambia con un fundido según el paso y la selección.
function FlowPanel() {
  const level = useExplorerStore((state) => state.level);
  const stepId = useExplorerStore((state) => state.stepId);
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const panelId = resolvePanelId(stepId, selectedRegions);
  // Acceso directo al registro (no una función): componentes estáticos para React
  const Panel = level === "country" ? PANELS[panelId] : null;
  const contentKey = `${panelId}:${selectedRegions.map((region) => region.id).join("|")}`;
  const variants = isDesktop ? CONTAINER_VARIANTS.desktop : CONTAINER_VARIANTS.mobile;

  return (
    <AnimatePresence initial={false}>
      {Panel && (
        <motion.aside
          key="flow-panel"
          aria-label="Panel de análisis"
          {...variants}
          transition={{ duration: 0.45, ease: EASE }}
          className="absolute inset-x-0 bottom-0 z-30 max-h-[60%] overflow-hidden border-t border-hud-border bg-space-950/95 backdrop-blur-md lg:static lg:max-h-none lg:shrink-0 lg:border-l lg:border-t-0"
        >
          <div className="h-full max-h-[inherit] overflow-y-auto p-5 lg:w-[28rem] lg:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default FlowPanel;
