import { AnimatePresence, motion } from "framer-motion";
import { ChartLine } from "lucide-react";
import { useDockStore } from "@/stores/useDockStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useT } from "@/i18n/useT";

// Botón flotante «Ver análisis» del mapa 2D (reemplaza a la hamburguesa).
// Abajo a la derecha, zona cómoda para el pulgar; un halo pulsante lo hace visible y
// la insignia indica cuántas zonas hay seleccionadas. Solo aparece con el dock cerrado.
function AnalysisLauncher({ className = "" }) {
  const isDockOpen = useDockStore((state) => state.activeTab !== null);
  const openTab = useDockStore((state) => state.openTab);
  const selectionCount = useExplorerStore((state) => state.selectedRegions.length);
  const { t } = useT();

  return (
    <AnimatePresence>
      {!isDockOpen && (
        <motion.button
          key="analysis-launcher"
          type="button"
          onClick={() => openTab("zone")}
          aria-label={selectionCount ? t(selectionCount > 1 ? "launcher.ariaMany" : "launcher.ariaOne", { count: selectionCount }) : t("launcher.label")}
          initial={{ opacity: 0, y: 12, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          whileTap={{ scale: 0.95 }}
          className={`group relative flex min-h-12 items-center gap-2 rounded-full border border-sensor-accent/70 bg-space-900/95 py-2 pl-3 pr-4 text-sm font-semibold text-ink shadow-[0_0_24px_-4px_var(--sensor-glow)] backdrop-blur-md transition-colors hover:border-sensor-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent ${className}`}
        >
          {/* Halo pulsante para captar la atención */}
          <span aria-hidden="true" className="absolute inset-0 -z-10 animate-ping rounded-full border border-sensor-accent/40 [animation-duration:2.4s]" />
          <span className="flex size-8 items-center justify-center rounded-full bg-sensor-accent/15 text-sensor-accent">
            <ChartLine aria-hidden="true" className="size-4" />
          </span>
          {t("launcher.label")}
          {selectionCount > 0 && (
            <span className="ml-0.5 flex size-5 items-center justify-center rounded-full bg-sensor-accent font-mono text-[11px] text-space-950">
              {selectionCount}
            </span>
          )}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

export default AnalysisLauncher;
