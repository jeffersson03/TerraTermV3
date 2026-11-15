import { useEffect } from "react";
import { EXPLORER_STEPS } from "@/features/explorer/constants/explorerSteps";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { isInteractiveTarget } from "@/utils/keyboard";

// Siguiente / anterior paso DISPONIBLE desde `index` en la dirección `step`
function findAvailableStep(index, step, selection) {
  for (let i = index + step; i >= 0 && i < EXPLORER_STEPS.length; i += step) {
    if (EXPLORER_STEPS[i].isAvailable(selection)) return EXPLORER_STEPS[i].id;
  }
  return null;
}

// ← / → recorren los pasos disponibles; Escape vuelve al globo.
// Solo activo en el mapa 2D del país.
export function useFlowKeyboard() {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || isInteractiveTarget(event.target)) return;
      const { level, stepId, selectedRegions, goToStep, exitToGlobe } = useExplorerStore.getState();
      if (level !== "country") return;

      if (event.key === "Escape") exitToGlobe();
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;

      const index = EXPLORER_STEPS.findIndex((step) => step.id === stepId);
      const target = findAvailableStep(index, event.key === "ArrowRight" ? 1 : -1, selectedRegions);
      if (target) goToStep(target);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
