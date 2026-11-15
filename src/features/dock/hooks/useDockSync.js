import { useEffect } from "react";
import { useDockStore } from "@/stores/useDockStore";

// Mantiene el dock coherente con el nivel del explorador:
//   - Al entrar a un país en escritorio, abre la pestaña «Zona» (como hacía el panel derecho).
//     En móvil no: la hoja taparía el mapa; se abre desde la hamburguesa.
//   - Al volver al globo, cierra «Zona» (ahí no existe); Tendencias y Asistente siguen abiertos.
export function useDockSync(level) {
  useEffect(() => {
    const { activeTab, openTab, close } = useDockStore.getState();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    if (level === "country" && isDesktop && activeTab === null) openTab("zone");
    if (level === "globe" && activeTab === "zone") close();
  }, [level]);
}
