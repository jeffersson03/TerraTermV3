import { detectDipole } from "@/features/analysis/utils/detectDipole";

const STATUS_STYLES = {
  dipole: "border-sensor-accent/60 text-sensor-accent",
  partial: "border-hud-border text-ink-secondary",
  same: "border-hud-border text-ink-secondary",
  insufficient: "border-hud-border text-ink-muted",
};

const STATUS_HELP = {
  dipole: "Ambas tendencias son significativas y de signo opuesto.",
  partial: "Las tendencias van en direcciones opuestas, pero no ambas son significativas.",
  same: "Ambas regiones cambian en la misma dirección.",
  insufficient: "Se necesitan al menos 10 años completos por región.",
};

// Veredicto del dipolo entre dos tendencias, explicado en una línea.
function DipoleVerdict({ trendA, trendB, isLoading }) {
  if (isLoading) return null;
  const result = detectDipole(trendA, trendB);

  return (
    <div role="status" className={`rounded-sm border px-3 py-2 ${STATUS_STYLES[result.status]}`}>
      <p className="text-sm font-semibold">{result.label}</p>
      <p className="text-[11px] text-ink-muted">{STATUS_HELP[result.status]}</p>
    </div>
  );
}

export default DipoleVerdict;
