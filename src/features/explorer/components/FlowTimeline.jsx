import { AnimatePresence, motion } from "framer-motion";
import { EXPLORER_STEPS, getStep } from "@/features/explorer/constants/explorerSteps";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

// Barra inferior del mapa 2D: pasos habilitados según la selección y el texto
// del paso activo. No se muestra en el globo (la monta ExplorerPage solo en 2D).
function FlowTimeline() {
  const stepId = useExplorerStore((state) => state.stepId);
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);
  const goToStep = useExplorerStore((state) => state.goToStep);

  const activeIndex = EXPLORER_STEPS.findIndex((step) => step.id === stepId);
  const step = getStep(stepId);

  return (
    <nav aria-label="Pasos del explorador" className="shrink-0 border-t border-hud-border bg-space-950/95 px-4 pb-3 pt-2 sm:px-6">
      <ol className="flex gap-2 sm:gap-4">
        {EXPLORER_STEPS.map((item, index) => {
          const isActive = item.id === stepId;
          const isAvailable = item.isAvailable(selectedRegions);
          return (
            <li key={item.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => goToStep(item.id)}
                disabled={!isAvailable}
                aria-current={isActive ? "step" : undefined}
                className="group flex w-full flex-col gap-1.5 rounded-sm pt-1 text-left focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent disabled:cursor-not-allowed"
              >
                <span className="relative h-0.5 w-full overflow-hidden rounded-full bg-hud-border">
                  <motion.span
                    className="absolute inset-y-0 left-0 bg-sensor-accent"
                    initial={false}
                    animate={{ width: index <= activeIndex ? "100%" : "0%" }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </span>
                <span
                  className={`truncate text-xs sm:text-sm ${
                    isActive ? "font-semibold text-ink" : isAvailable ? "text-ink-secondary group-hover:text-ink" : "text-ink-muted opacity-50"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="relative mt-2 min-h-[1.5rem] overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={step.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-sm text-ink-secondary sm:text-base"
          >
            {step.caption}
          </motion.p>
        </AnimatePresence>
      </div>
    </nav>
  );
}

export default FlowTimeline;
