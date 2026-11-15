import { Sparkles } from "lucide-react";
import HudButton from "@/components/Hud/HudButton";
import { PRESET_COMPARISONS } from "@/constants/regions";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useCountryRegions } from "@/features/map2d/hooks/useCountryRegions";
import { resolvePresetZones } from "@/features/explorer/utils/resolvePresetZones";
import TrendRanking from "@/features/map2d/components/TrendRanking";
import { useT } from "@/i18n/useT";

const KIND_KEY = {
  land: "country.kindLand",
  ocean: "country.kindOcean",
};

// Paso "País": qué se puede seleccionar en la vista activa y comparaciones de ejemplo.
function CountryPanel() {
  const countryId = useExplorerStore((state) => state.countryId);
  const setSelection = useExplorerStore((state) => state.setSelection);
  const domain = useTelemetryStore((state) => state.domain);
  const setDomain = useTelemetryStore((state) => state.setDomain);
  const regions = useCountryRegions(countryId);
  const sensor = getSensor(domain);
  const { t, tc } = useT();

  const applyPreset = (preset, zones) => {
    setDomain(preset.domain);
    setSelection(zones);
  };

  const selectableText = sensor.selectableKinds.map((kind) => t(KIND_KEY[kind])).join(` ${t("common.and")} `);
  const country = regions.country;

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h2 className="text-2xl font-semibold text-ink sm:text-3xl">{country && tc("countries", country.id, "name", country.name)}</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          {t("country.view")} <span className="text-sensor-accent">{sensor.label}</span>: {t("country.intro", { kinds: selectableText })}
        </p>
        <p className="mt-2 text-xs text-ink-muted">{tc("sensors", domain, "map2dNote", sensor.map2d.note)}</p>
      </header>

      {regions.status === "ready" && (
        <section aria-label={t("country.examplesLabel")} className="flex flex-col gap-2">
          <h3 className="text-[11px] uppercase tracking-wider text-ink-secondary">{t("country.examples")}</h3>
          {PRESET_COMPARISONS.map((preset) => {
            const zones = resolvePresetZones(preset, regions);
            return (
              <HudButton
                key={preset.id}
                variant="ghost"
                icon={Sparkles}
                disabled={!zones}
                title={zones ? undefined : t("country.needsAdm1")}
                onClick={() => applyPreset(preset, zones)}
                className="justify-start"
              >
                {tc("presets", preset.id, "label", preset.label)}
              </HudButton>
            );
          })}
        </section>
      )}

      {/* Otra forma de ver el mapa: lista ordenada por tendencia real, seleccionable */}
      <TrendRanking />
    </div>
  );
}

export default CountryPanel;
