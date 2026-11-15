import { ArrowLeft, Layers } from "lucide-react";
import HudButton from "@/components/Hud/HudButton";
import HudPanel from "@/components/Hud/HudPanel";
import { useSelectionContext } from "@/features/explorer/hooks/useSelectionContext";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useT } from "@/i18n/useT";

// Paso "Ciudad": detalle urbano de la primera zona de TIERRA seleccionada.
// La escena térmica (ECOSTRESS 70 m / Landsat 100 m) se incorporará con la investigación.
function CityPanel() {
  const { regions } = useSelectionContext();
  const region = regions.find((item) => item.kind === "land");
  const goToStep = useExplorerStore((state) => state.goToStep);
  const backStep = regions.length === 2 ? "compare" : "cell";
  const { t } = useT();
  // Durante la animación de salida la selección puede haber cambiado ya
  if (!region) return null;

  return (
    <div data-sensor={region.sensorId} className="flex flex-col gap-4">
      <HudButton variant="ghost" icon={ArrowLeft} onClick={() => goToStep(backStep)} className="self-start">
        {backStep === "compare" ? t("city.backCompare") : t("city.backCell")}
      </HudButton>

      <header>
        <h2 className="text-2xl font-semibold text-ink">{t("city.title", { region: region.label })}</h2>
        <p className="mt-1 text-sm text-ink-secondary">{t("city.subtitle")}</p>
      </header>

      <HudPanel title={t("city.layer")} actions={<Layers className="h-4 w-4 text-ink-muted" aria-hidden="true" />}>
        <span className="inline-block rounded-full border border-sensor-accent/50 bg-sensor-glow px-3 py-1 text-xs text-sensor-accent">
          {t("city.pending")}
        </span>
        <p className="mt-3 text-sm text-ink-secondary">{t("city.description")}</p>
      </HudPanel>

      <p className="text-xs text-ink-muted">{t("city.note")}</p>
    </div>
  );
}

export default CityPanel;
