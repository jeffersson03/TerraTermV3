import PeriodChips from "@/features/filters/components/PeriodChips";
import RegionComparison from "@/features/explorer/components/panels/RegionComparison";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { findPeriodPreset } from "@/constants/periods";

// Paso "Periodo" (zonas del mismo tipo): la misma comparación, cambiando la ventana temporal.
function PeriodPanel() {
  const { regions, variable, period } = useSelectionContext();
  const preset = findPeriodPreset(period);
  // Durante la animación de salida la selección puede haber cambiado ya
  if (regions.length < 2 || !variable) return null;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink">¿Cambia la señal con el periodo?</h2>
        <p className="mt-1 text-sm text-ink-secondary">{variable.label}</p>
      </header>

      <PeriodChips />
      {preset && <p className="text-[11px] text-ink-muted">{preset.note}</p>}

      <RegionComparison regions={regions} variable={variable} period={period} />
    </div>
  );
}

export default PeriodPanel;
