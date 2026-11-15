import { detectDipole } from "@/features/analysis/utils/detectDipole";
import { useT } from "@/i18n/useT";

const STATUS_STYLES = {
  dipole: "border-sensor-accent/60 text-sensor-accent",
  partial: "border-hud-border text-ink-secondary",
  same: "border-hud-border text-ink-secondary",
  insufficient: "border-hud-border text-ink-muted",
};

// Veredicto del dipolo entre dos tendencias, explicado en una línea.
// Textos por estado en i18n: dipole.<estado>.label / .help
function DipoleVerdict({ trendA, trendB, isLoading }) {
  const { t } = useT();
  if (isLoading) return null;
  const result = detectDipole(trendA, trendB);

  return (
    <div role="status" className={`rounded-sm border px-3 py-2 ${STATUS_STYLES[result.status]}`}>
      <p className="text-sm font-semibold">{t(`dipole.${result.status}.label`)}</p>
      <p className="text-[11px] text-ink-muted">{t(`dipole.${result.status}.help`)}</p>
    </div>
  );
}

export default DipoleVerdict;
