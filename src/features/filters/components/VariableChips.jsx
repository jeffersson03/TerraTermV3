import OptionChips from "@/features/filters/components/OptionChips";
import { getVariable } from "@/constants/variables";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useT } from "@/i18n/useT";

// Selector de variable. `variableIds` limita las opciones (p. ej. las de una región).
function VariableChips({ variableIds }) {
  const variableId = useFiltersStore((state) => state.variableId);
  const setVariable = useFiltersStore((state) => state.setVariable);
  const { t, tc } = useT();

  const options = variableIds
    .map(getVariable)
    .filter(Boolean)
    .map((variable) => ({ value: variable.id, label: tc("variables", variable.id, "label", variable.label), description: variable.source }));

  return <OptionChips label={t("filters.variable")} options={options} value={variableId} onChange={setVariable} />;
}

export default VariableChips;
