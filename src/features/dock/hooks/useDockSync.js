import { useEffect, useRef } from "react";
import { useDockStore } from "@/stores/useDockStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { isTabAvailable } from "@/features/dock/components/dockRegistry";

// Mantiene el dock coherente con el explorador:
//   - Al entrar a un país en escritorio, abre «Zona» (en móvil no: dejaría poco mapa).
//   - Al seleccionar la segunda zona (comparar), abre «Zona» en cualquier dispositivo:
//     en móvil aparece debajo del mapa con la comparación.
//   - Al volver al globo, cierra las pestañas que solo existen en el 2D.
export function useDockSync(level) {
  const selectionCount = useExplorerStore((state) => state.selectedRegions.length);
  const previousCount = useRef(selectionCount);

  useEffect(() => {
    const { activeTab, openTab, close } = useDockStore.getState();
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;

    if (level === "country" && isDesktop && activeTab === null) openTab("zone");
    if (activeTab && !isTabAvailable(activeTab, level)) close();
  }, [level]);

  useEffect(() => {
    const becameComparison = selectionCount === 2 && previousCount.current < 2;
    previousCount.current = selectionCount;
    if (level === "country" && becameComparison) useDockStore.getState().openTab("zone");
  }, [selectionCount, level]);
}
