import OptionChips from "@/features/filters/components/OptionChips";
import { PERIOD_PRESETS, findPeriodPreset } from "@/constants/periods";
import { useFiltersStore } from "@/stores/useFiltersStore";

const OPTIONS = PERIOD_PRESETS.map((preset) => ({ value: preset.id, label: preset.label, description: preset.note }));

// Selector de periodo entre los presets de análisis.
function PeriodChips() {
  const period = useFiltersStore((state) => state.period);
  const setPeriod = useFiltersStore((state) => state.setPeriod);
  const activePreset = findPeriodPreset(period);

  const handleChange = (presetId) => {
    const preset = PERIOD_PRESETS.find((item) => item.id === presetId);
    if (preset) setPeriod(preset.period);
  };

  return <OptionChips label="Periodo" options={OPTIONS} value={activePreset?.id} onChange={handleChange} />;
}

export default PeriodChips;
