import { ArrowLeft, Layers } from "lucide-react";
import HudButton from "@/components/Hud/HudButton";
import HudPanel from "@/components/Hud/HudPanel";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";

// Paso "Ciudad": detalle urbano de la primera zona de TIERRA seleccionada.
// La escena térmica (ECOSTRESS 70 m / Landsat 100 m) se incorporará con la investigación.
function CityPanel() {
  const { regions } = useSelectionContext();
  const region = regions.find((item) => item.kind === "land");
  const goToStep = useExplorerStore((state) => state.goToStep);
  const backStep = regions.length === 2 ? "compare" : "cell";
  // Durante la animación de salida la selección puede haber cambiado ya
  if (!region) return null;

  return (
    <div data-sensor={region.sensorId} className="flex flex-col gap-4">
      <HudButton variant="ghost" icon={ArrowLeft} onClick={() => goToStep(backStep)} className="self-start">
        {backStep === "compare" ? "Volver a comparar" : "Volver a la celda"}
      </HudButton>

      <header>
        <h2 className="text-2xl font-semibold text-ink">{region.label} a escala urbana</h2>
        <p className="mt-1 text-sm text-ink-secondary">Imagen satelital de referencia</p>
      </header>

      <HudPanel title="Capa ECOSTRESS" actions={<Layers className="h-4 w-4 text-ink-muted" aria-hidden="true" />}>
        <span className="inline-block rounded-full border border-sensor-accent/50 bg-sensor-glow px-3 py-1 text-xs text-sensor-accent">
          Escena térmica por incorporar
        </span>
        <p className="mt-3 text-sm text-ink-secondary">
          Al activarla verás la temperatura superficial a 70 m, la fecha de captura y la leyenda de la escena.
        </p>
      </HudPanel>

      <p className="text-xs text-ink-muted">La tendencia regional se calcula con las series de NASA POWER / GPM.</p>
    </div>
  );
}

export default CityPanel;
