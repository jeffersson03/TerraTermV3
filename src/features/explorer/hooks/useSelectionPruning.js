import { useEffect } from "react";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

// Al cambiar de vista, descarta las zonas que la nueva vista no permite
// (p. ej. una celda de océano al pasar a Terra). Montar UNA vez.
export function useSelectionPruning() {
  const domain = useTelemetryStore((state) => state.domain);
  const pruneSelection = useExplorerStore((state) => state.pruneSelection);

  useEffect(() => {
    pruneSelection(getSensor(domain).selectableKinds);
  }, [domain, pruneSelection]);
}
