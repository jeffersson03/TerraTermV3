import VariableChips from "@/features/filters/components/VariableChips";
import RegionComparison from "@/features/explorer/components/panels/RegionComparison";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";
import { formatPeriod } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

// Paso "Comparar" (zonas del mismo tipo): dos zonas, una variable, el mismo periodo.
function ComparePanel() {
  const { regions, commonVariableIds, variable, period } = useSelectionContext();
  const { t, tc, locale } = useT();
  // Durante la animación de salida la selección puede haber cambiado ya
  if (regions.length < 2 || !variable) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink">
          {regionDisplayLabel(regions[0], t)} <span className="text-ink-muted">vs.</span> {regionDisplayLabel(regions[1], t)}
        </h2>
        <p className="mt-1 text-sm text-ink-secondary">{tc("variables", variable.id, "label", variable.label)}</p>
      </header>

      <VariableChips variableIds={commonVariableIds} />
      <p className="font-mono text-xs text-ink-muted">{formatPeriod(period, locale)}</p>

      <RegionComparison regions={regions} variable={variable} period={period} />
    </div>
  );
}

export default ComparePanel;
