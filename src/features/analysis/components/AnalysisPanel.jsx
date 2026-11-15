import { Component, lazy, Suspense } from "react";
import { useT } from "@/i18n/useT";

// Carga diferida: el JSON de series y el motor estadístico no entran en el bundle inicial del globo.
const TrendExplorer = lazy(() => import("@/features/analysis/components/TrendExplorer"));

// Aísla fallos del módulo de análisis: un error aquí no tumba el globo ni el mapa 2D.
class AnalysisBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <PanelMessage textKey="analysis.unavailable" />;
    return this.props.children;
  }
}

// Mensaje traducido (la clase del boundary no puede usar hooks)
function PanelMessage({ textKey }) {
  const { t } = useT();
  return <p className="p-5 text-sm text-ink-secondary">{t(textKey)}</p>;
}

// Contenido de la pestaña «Tendencias» del dock: análisis con datos reales (NASA POWER / GPM IMERG).
function AnalysisPanel() {
  return (
    <AnalysisBoundary>
      <Suspense fallback={<PanelMessage textKey="analysis.loading" />}>
        <TrendExplorer />
      </Suspense>
    </AnalysisBoundary>
  );
}

export default AnalysisPanel;
