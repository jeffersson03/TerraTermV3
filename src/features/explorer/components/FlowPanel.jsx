import { AnimatePresence, motion } from "framer-motion";
import { PANELS, resolvePanelId } from "@/features/explorer/components/panelRegistry";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

const EASE = [0.22, 1, 0.36, 1];

// Contenido del panel del explorador (pestaña «Zona» del dock lateral).
// El contenedor (columna en escritorio, hoja en móvil) lo pone SideDock.
// El contenido cambia con un fundido según el paso y la selección.
function FlowPanel() {
  const level = useExplorerStore((state) => state.level);
  const stepId = useExplorerStore((state) => state.stepId);
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);

  const panelId = resolvePanelId(stepId, selectedRegions);
  // Acceso directo al registro (no una función): componentes estáticos para React
  const Panel = level === "country" ? PANELS[panelId] : null;
  const contentKey = `${panelId}:${selectedRegions.map((region) => region.id).join("|")}`;

  if (!Panel) {
    return <p className="p-5 text-sm text-ink-secondary">Elige un país en el globo para explorar sus zonas.</p>;
  }

  return (
    <div className="p-5 lg:p-6">
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
  );
}

export default FlowPanel;
