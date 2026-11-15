import PeriodChips from "@/features/filters/components/PeriodChips";
import RegionComparison from "@/features/explorer/components/panels/RegionComparison";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { findPeriodPreset } from "@/constants/periods";
import { useT } from "@/i18n/useT";

// Paso "Periodo" (zonas del mismo tipo): la misma comparación, cambiando la ventana temporal.
function PeriodPanel() {
  const { regions, variable, period } = useSelectionContext();
  const preset = findPeriodPreset(period);
  const { t, tc } = useT();
  // Durante la animación de salida la selección puede haber cambiado ya
  if (regions.length < 2 || !variable) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink">{t("period.title")}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{tc("variables", variable.id, "label", variable.label)}</p>
      </header>

      <PeriodChips />
      {preset && <p className="text-[11px] text-ink-muted">{tc("periods", preset.id, "note", preset.note)}</p>}

      <RegionComparison regions={regions} variable={variable} period={period} />
    </div>
  );
}

export default PeriodPanel;
