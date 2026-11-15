import { ArrowLeft } from "lucide-react";

// Ruta de navegación del mapa 2D: "← Mundo / Perú / A · Piura vs B · Puno".
function MapBreadcrumb({ countryName, selectedRegions, onBack }) {
  return (
    <nav aria-label="Ubicación" className="flex items-center gap-2 rounded-full border border-hud-border bg-space-900/85 py-1 pl-1 pr-4 text-sm backdrop-blur-md">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 rounded-full px-3 py-1 text-ink-secondary transition-colors hover:bg-space-800 hover:text-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-sensor-accent"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Mundo
      </button>
      <span className="text-ink-muted">/</span>
      <span className="truncate font-semibold text-ink">{countryName}</span>
      {selectedRegions.map((region) => (
        <span key={region.id} data-sensor={region.sensorId} className="hidden items-center gap-2 sm:flex">
          <span className="text-ink-muted">/</span>
          <span className="text-sensor-accent">
            {region.marker} · {region.label}
          </span>
        </span>
      ))}
    </nav>
  );
}

export default MapBreadcrumb;
