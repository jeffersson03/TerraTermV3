import { useMemo, useState } from "react";
import { geoEquirectangular } from "d3-geo";
import { getSensor } from "@/constants/sensors";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useHoverStore } from "@/stores/useHoverStore";
import { useElementSize } from "@/hooks/useElementSize";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useCountryRegions } from "@/features/map2d/hooks/useCountryRegions";
import { useFiltersStore } from "@/stores/useFiltersStore";
import ThermalRasterLayer from "@/features/map2d/components/ThermalRasterLayer";
import RegionLayer from "@/features/map2d/components/RegionLayer";
import SelectionLabels from "@/features/map2d/components/SelectionLabels";
import TrendChoroplethLayer from "@/features/map2d/components/TrendChoroplethLayer";
import TrendLegendPanel from "@/features/map2d/components/TrendLegendPanel";
import { useTrendMap } from "@/features/map2d/hooks/useTrendMap";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";
import { useDockStore } from "@/stores/useDockStore";

// Rectángulo del mapa dibujado (bbox proyectado): la leyenda toma exactamente su ancho.
function legendStyle(projection, viewBbox, isLauncherVisible) {
  const [west, south, east, north] = viewBbox;
  const [x0] = projection([west, north]);
  const [x1] = projection([east, south]);
  const bottom = isLauncherVisible ? LEGEND_BOTTOM.launcherVisible : LEGEND_BOTTOM.launcherHidden;
  return { left: x0, width: x1 - x0, bottom };
}

// Qué zonas se colorean con la tendencia según la vista: Global ambas, Terra tierra, Aqua mar.
function trendScope(map2d) {
  if (map2d.land && map2d.ocean) return "both";
  return map2d.land ? "land" : "ocean";
}

// Márgenes para no quedar bajo los controles HUD: arriba la ruta y el selector de vista;
// abajo la leyenda (≈ 44 px) y, con el dock cerrado, el botón «Ver análisis» que asoma sobre el borde.
const PADDING = { top: 64, right: 16, bottom: 92, left: 16 };
const LEGEND_BOTTOM = { launcherVisible: 36, launcherHidden: 10 };

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
  const period = useFiltersStore((state) => state.period);
  const trendStatus = useTrendMapStore((state) => state.status);
  const trends = useTrendMapStore((state) => state.trends);
  useTrendMap({ regions, period });
  const isDockOpen = useDockStore((state) => state.activeTab !== null);
  const scope = trendScope(sensor.map2d);
  const hasTrends = trendStatus === "ready";

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
      regionId: hoveredRegion?.id ?? null, // la sonda muestra la tendencia real de esta zona
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
          {/* Textura ilustrativa: solo de fondo tenue mientras llega la tendencia real; luego se oculta */}
          <div className={`absolute inset-0 transition-opacity duration-700 ${hasTrends ? "opacity-0" : "opacity-40"}`}>
            <ThermalRasterLayer projection={projection} viewBbox={regions.viewBbox} map2d={sensor.map2d} />
          </div>
          {hasTrends && (
            <TrendChoroplethLayer
              projection={projection}
              width={width}
              height={height}
              landRegions={regions.landRegions}
              oceanRegions={regions.oceanRegions}
              showLand={scope !== "ocean"}
              showOcean={scope !== "land"}
              trends={trends}
            />
          )}
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
          <SelectionLabels projection={projection} width={width} selectedRegions={selectedRegions} />
          <TrendLegendPanel style={legendStyle(projection, regions.viewBbox, !isDockOpen)} />
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
