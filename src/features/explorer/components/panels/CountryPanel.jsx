import { Sparkles } from "lucide-react";
import HudButton from "@/components/Hud/HudButton";
import { PRESET_COMPARISONS } from "@/constants/regions";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useCountryRegions } from "@/features/map2d/hooks/useCountryRegions";
import { resolvePresetZones } from "@/features/explorer/utils/resolvePresetZones";

const KIND_TEXT = {
  land: "departamentos",
  ocean: "celdas de océano",
};

// Paso "País": qué se puede seleccionar en la vista activa y comparaciones de ejemplo.
function CountryPanel() {
  const countryId = useExplorerStore((state) => state.countryId);
  const setSelection = useExplorerStore((state) => state.setSelection);
  const domain = useTelemetryStore((state) => state.domain);
  const setDomain = useTelemetryStore((state) => state.setDomain);
  const regions = useCountryRegions(countryId);
  const sensor = getSensor(domain);

  const applyPreset = (preset, zones) => {
    setDomain(preset.domain);
    setSelection(zones);
  };

  const selectableText = sensor.selectableKinds.map((kind) => KIND_TEXT[kind]).join(" y ");

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{regions.country?.name}</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Vista <span className="text-sensor-accent">{sensor.label}</span>: puedes seleccionar {selectableText}. Elige
          una zona para ver su tendencia y una segunda para compararlas.
        </p>
        <p className="mt-2 text-xs text-ink-muted">{sensor.map2d.note}</p>
      </header>

      {regions.status === "ready" && (
        <section aria-label="Comparaciones de ejemplo" className="flex flex-col gap-2">
          <h3 className="text-[11px] uppercase tracking-wider text-ink-secondary">Ejemplos</h3>
          {PRESET_COMPARISONS.map((preset) => {
            const zones = resolvePresetZones(preset, regions);
            return (
              <HudButton
                key={preset.id}
                variant="ghost"
                icon={Sparkles}
                disabled={!zones}
                title={zones ? undefined : "Requiere los departamentos del país (ADM1)"}
                onClick={() => applyPreset(preset, zones)}
                className="justify-start"
              >
                {preset.label}
              </HudButton>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default CountryPanel;
