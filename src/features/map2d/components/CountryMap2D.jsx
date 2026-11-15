import { useMemo, useState } from "react";
import { geoEquirectangular } from "d3-geo";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useHoverStore } from "@/stores/useHoverStore";
import { useElementSize } from "@/hooks/useElementSize";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useCountryRegions } from "@/features/map2d/hooks/useCountryRegions";
import ThermalRasterLayer from "@/features/map2d/components/ThermalRasterLayer";
import RegionLayer from "@/features/map2d/components/RegionLayer";
import SelectionLabels from "@/features/map2d/components/SelectionLabels";

// Márgenes para no quedar bajo los controles HUD (selector arriba, paneles abajo)
const PADDING = { top: 72, right: 24, bottom: 24, left: 24 };

// Proyección equirectangular ajustada al área visible. Es lineal en lon/lat,
// por eso el ráster de las texturas encaja sin reproyectar.
function buildProjection(viewBbox, width, height) {
  const [west, south, east, north] = viewBbox;
  return geoEquirectangular().fitExtent(
    [
      [PADDING.left, PADDING.top],
      [width - PADDING.right, height - PADDING.bottom],
    ],
    { type: "MultiPoint", coordinates: [[west, south], [east, north]] }
  );
}

// Mapa 2D fijo de un país: ráster térmico + zonas seleccionables + etiquetas.
// Lo que se colorea y se puede seleccionar depende de la vista activa.
function CountryMap2D({ countryId }) {
  const [container, setContainer] = useState(null);
  const { width, height } = useElementSize(container);
  const regions = useCountryRegions(countryId);
  const sensor = getSensor(useTelemetryStore((state) => state.domain));
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);
  const toggleRegion = useExplorerStore((state) => state.toggleRegion);
  const setHoveredLocation = useHoverStore((state) => state.setHoveredLocation);
  const clearHover = useHoverStore((state) => state.clearHover);
  const [hoveredRegion, setHoveredRegion] = useState(null);

  const isReady = regions.status === "ready" && width > 0 && height > 0;
  const projection = useMemo(
    () => (isReady ? buildProjection(regions.viewBbox, width, height) : null),
    [isReady, regions.viewBbox, width, height]
  );

  // Coordenadas y posición del cursor → HoverProbe (mismo store que el globo)
  const handlePointerMove = (event) => {
    if (!projection) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const [lon, lat] = projection.invert([event.clientX - bounds.left, event.clientY - bounds.top]);
    setHoveredLocation({
      lat,
      lon,
      country: hoveredRegion?.kind === "land" ? hoveredRegion.label : null, // null = océano
      screenX: event.clientX,
      screenY: event.clientY,
    });
  };

  return (
    <div
      ref={setContainer}
      onPointerMove={handlePointerMove}
      onPointerLeave={clearHover}
      className="absolute inset-0 overflow-hidden bg-space-950"
    >
      {!projection && (
        <p role="status" className="absolute inset-0 grid place-items-center font-mono text-xs text-ink-muted">
          {regions.status === "error" ? "No se pudo cargar el país." : "Preparando mapa…"}
        </p>
      )}

      {projection && (
        <>
          <ThermalRasterLayer projection={projection} viewBbox={regions.viewBbox} map2d={sensor.map2d} />
          <RegionLayer
            projection={projection}
            width={width}
            height={height}
            landRegions={regions.landRegions}
            oceanRegions={regions.oceanRegions}
            contextFeatures={regions.contextFeatures}
            selectableKinds={sensor.selectableKinds}
            selectedRegions={selectedRegions}
            onToggle={toggleRegion}
            onHover={setHoveredRegion}
          />
          <SelectionLabels projection={projection} selectedRegions={selectedRegions} />
        </>
      )}

      {regions.usedFallback && (
        <p className="absolute right-4 top-16 max-w-xs rounded-sm border border-hud-border bg-space-900/85 px-3 py-1.5 text-[11px] text-ink-secondary">
          Divisiones administrativas no disponibles: se usa el contorno del país.
        </p>
      )}
    </div>
  );
}

export default CountryMap2D;
