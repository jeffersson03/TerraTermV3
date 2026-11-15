import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

// Zonas seleccionadas + variable común + periodo. Si la variable elegida no
// aplica a todas las zonas (p. ej. SST en tierra), usa la primera común.
// `commonVariableIds` vacío = zonas de distinto tipo (tierra vs. océano).
export function useSelectionContext() {
  const regions = useExplorerStore((state) => state.selectedRegions);
  const selectedVariableId = useFiltersStore((state) => state.variableId);
  const period = useFiltersStore((state) => state.period);

  const commonVariableIds = regions.reduce(
    (common, region) => common.filter((id) => region.variables.includes(id)),
    regions[0]?.variables ?? []
  );
  const variableId = commonVariableIds.includes(selectedVariableId) ? selectedVariableId : commonVariableIds[0];

  return {
    regions,
    commonVariableIds,
    variable: variableId ? getVariable(variableId) : null,
    period,
    isCrossKind: regions.length === 2 && regions[0].kind !== regions[1].kind,
  };
}
