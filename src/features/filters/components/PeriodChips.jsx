import OptionChips from "@/features/filters/components/OptionChips";
import { PERIOD_PRESETS, findPeriodPreset } from "@/constants/periods";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { useT } from "@/i18n/useT";

// Selector de periodo entre los presets de análisis.
function PeriodChips() {
  const period = useFiltersStore((state) => state.period);
  const setPeriod = useFiltersStore((state) => state.setPeriod);
  const activePreset = findPeriodPreset(period);
  const { t, tc } = useT();

  const options = PERIOD_PRESETS.map((preset) => ({
    value: preset.id,
    label: preset.label,
    description: tc("periods", preset.id, "note", preset.note),
  }));

  const handleChange = (presetId) => {
    const preset = PERIOD_PRESETS.find((item) => item.id === presetId);
    if (preset) setPeriod(preset.period);
  };

  return <OptionChips label={t("filters.period")} options={options} value={activePreset?.id} onChange={handleChange} />;
}

export default PeriodChips;
