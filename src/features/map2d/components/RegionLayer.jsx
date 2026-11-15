import { useMemo } from "react";
import { geoPath } from "d3-geo";
import { useT } from "@/i18n/useT";
import { regionDisplayLabel } from "@/features/map2d/utils/regionModel";

const BASE_SHAPE = "transition-[fill,stroke,opacity] duration-200 outline-none";

const STYLES = {
  land: "fill-transparent stroke-ink-secondary/60 [stroke-width:0.75]",
  ocean: "fill-transparent stroke-hud-border [stroke-width:0.5]",
  selectable: "cursor-pointer hover:fill-ink/10 focus-visible:fill-ink/10",
  disabled: "pointer-events-none opacity-25",
  selected: "fill-sensor-glow stroke-sensor-accent [stroke-width:2]",
};

function handleKeyToggle(event, onToggle, region) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onToggle(region);
  }
}

// Una zona seleccionable: <path> (departamento) o <rect> (celda de océano)
function RegionShape({ region, shapeProps, isSelectable, selected, onToggle, onHover }) {
  const { t } = useT();
  const Tag = region.kind === "land" ? "path" : "rect";
  const stateClass = selected ? STYLES.selected : isSelectable ? STYLES.selectable : STYLES.disabled;

  return (
    <g data-sensor={selected?.sensorId}>
      <Tag
        {...shapeProps}
        role={isSelectable ? "button" : undefined}
        tabIndex={isSelectable ? 0 : -1}
        aria-pressed={isSelectable ? Boolean(selected) : undefined}
        aria-label={isSelectable ? regionDisplayLabel(region, t) : undefined}
        className={`${BASE_SHAPE} ${STYLES[region.kind]} ${stateClass}`}
        onClick={isSelectable ? () => onToggle(region) : undefined}
        onKeyDown={isSelectable ? (event) => handleKeyToggle(event, onToggle, region) : undefined}
        onPointerEnter={() => onHover(region)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(region)}
        onBlur={() => onHover(null)}
      />
    </g>
  );
}

// Capa vectorial: países vecinos (referencia), departamentos y celdas de mar.
// Qué se puede seleccionar lo decide `selectableKinds` (registro de vistas).
function RegionLayer({ projection, width, height, landRegions, oceanRegions, contextFeatures, selectableKinds, selectedRegions, onToggle, onHover }) {
  const path = useMemo(() => geoPath(projection), [projection]);
  const { t } = useT();
  const selectedById = useMemo(() => new Map(selectedRegions.map((region) => [region.id, region])), [selectedRegions]);

  const cellRect = ({ bbox: [west, south, east, north] }) => {
    const [x0, y0] = projection([west, north]);
    const [x1, y1] = projection([east, south]);
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  const renderRegion = (region, shapeProps) => (
    <RegionShape
      key={region.id}
      region={region}
      shapeProps={shapeProps}
      isSelectable={selectableKinds.includes(region.kind)}
      selected={selectedById.get(region.id)}
      onToggle={onToggle}
      onHover={onHover}
    />
  );

  return (
    <svg width={width} height={height} className="absolute inset-0" aria-label={t("map.zonesLabel")}>
      <g aria-hidden="true">
        {contextFeatures.map((feature) => (
          <path key={feature.id} d={path(feature)} className="fill-space-950/40 stroke-hud-border [stroke-width:0.5]" />
        ))}
      </g>
      <g>{oceanRegions.map((region) => renderRegion(region, cellRect(region)))}</g>
      <g>{landRegions.map((region) => renderRegion(region, { d: path(region.feature) }))}</g>
    </svg>
  );
}

export default RegionLayer;
