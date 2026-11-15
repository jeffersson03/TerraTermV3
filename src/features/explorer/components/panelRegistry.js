import CountryPanel from "@/features/explorer/components/panels/CountryPanel";
import CellPanel from "@/features/explorer/components/panels/CellPanel";
import ComparePanel from "@/features/explorer/components/panels/ComparePanel";
import PeriodPanel from "@/features/explorer/components/panels/PeriodPanel";
import CityPanel from "@/features/explorer/components/panels/CityPanel";
import CorrelationPanel from "@/features/explorer/components/panels/CorrelationPanel";

// Paneles laterales por id. Para un panel nuevo: crear el componente en
// panels/ y registrarlo aquí. Uso: `const Panel = PANELS[panelId]`.
// Los paneles no reciben props: leen la selección con useSelectionContext.
export const PANELS = Object.freeze({
  country: CountryPanel,
  cell: CellPanel,
  compare: ComparePanel,
  period: PeriodPanel,
  city: CityPanel,
  correlation: CorrelationPanel,
});

// Panel a mostrar según el paso. Comparar/Periodo con tierra + océano
// (solo posible en Classic) se resuelven como correlación.
export function resolvePanelId(stepId, selection) {
  const isCrossKind = selection.length === 2 && selection[0].kind !== selection[1].kind;
  if ((stepId === "compare" || stepId === "period") && isCrossKind) return "correlation";
  return stepId;
}
