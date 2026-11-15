import { Component, lazy, Suspense } from "react";

// Carga diferida: el JSON de series y el motor estadístico no entran en el bundle inicial del globo.
const TrendExplorer = lazy(() => import("@/features/analysis/components/TrendExplorer"));

// Aísla fallos del módulo de análisis: un error aquí no tumba el globo ni el mapa 2D.
class AnalysisBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <p className="p-5 text-sm text-ink-secondary">El análisis no está disponible en este momento.</p>;
    }
    return this.props.children;
  }
}

// Contenido de la pestaña «Tendencias» del dock: análisis con datos reales (NASA POWER / GPM IMERG).
function AnalysisPanel() {
  return (
    <AnalysisBoundary>
      <Suspense fallback={<p className="p-5 text-sm text-ink-secondary">Cargando el análisis…</p>}>
        <TrendExplorer />
      </Suspense>
    </AnalysisBoundary>
  );
}

export default AnalysisPanel;
