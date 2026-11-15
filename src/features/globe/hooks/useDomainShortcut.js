import { useEffect } from "react";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { isInteractiveTarget } from "@/utils/keyboard";

// Atajo de teclado: [Espacio] cicla el dominio (classic → terra → aqua).
// No guarda estado propio: el dominio vive solo en useTelemetryStore.
// Montar UNA sola vez (hoy en GlobeCanvas) para no duplicar el listener.
export function useDomainShortcut() {
  const cycleDomain = useTelemetryStore((state) => state.cycleDomain);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.repeat || isInteractiveTarget(event.target)) return;

      if (event.code === "Space") {
        event.preventDefault();
        cycleDomain();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cycleDomain]);
}
