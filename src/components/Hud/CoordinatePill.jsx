import { formatLatitude, formatLongitude } from "@/utils/formatCoordinates";
import { useT } from "@/i18n/useT";

// Etiqueta de coordenadas tipo "14,07° S · 75,73° O" con una línea opcional
// (país, zona…). Presentacional: recibe los valores por props.
function CoordinatePill({ lat, lon, label, className = "" }) {
  const { locale } = useT();
  return (
    <div
      className={`inline-flex flex-col gap-0.5 rounded-sm border border-hud-border bg-space-900/85 px-3 py-1.5 backdrop-blur-md ${className}`}
    >
      <span className="font-mono text-xs tabular-nums text-ink">
        {formatLatitude(lat, locale)} <span className="text-ink-muted">·</span> {formatLongitude(lon, locale)}
      </span>
      {label && <span className="text-[11px] text-sensor-accent">{label}</span>}
    </div>
  );
}

export default CoordinatePill;
