import OptionChips from "@/features/filters/components/OptionChips";
import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";

// Selector de variable. `variableIds` limita las opciones (p. ej. las de una región).
function VariableChips({ variableIds }) {
  const variableId = useFiltersStore((state) => state.variableId);
  const setVariable = useFiltersStore((state) => state.setVariable);

  const options = variableIds
    .map(getVariable)
    .filter(Boolean)
    .map((variable) => ({ value: variable.id, label: variable.label, description: variable.source }));

  return <OptionChips label="Variable" options={options} value={variableId} onChange={setVariable} />;
}

export default VariableChips;
