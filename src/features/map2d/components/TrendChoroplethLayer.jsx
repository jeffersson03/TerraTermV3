import { useMemo } from "react";
import { geoPath } from "d3-geo";
import { trendColor, trendOpacity } from "@/features/map2d/utils/trendColor";

// Capa de color: cada departamento / celda de mar pintado según su tendencia térmica real.
// Solo dibuja; la selección y el hover siguen en RegionLayer, que va encima.
function TrendChoroplethLayer({ projection, width, height, landRegions, oceanRegions, showLand, showOcean, trends }) {
  const path = useMemo(() => geoPath(projection), [projection]);

  const fillProps = (region) => {
    const entry = trends.get(region.id);
    if (!entry || entry.trend.slopePerDecade == null) return null;
    return { fill: trendColor(entry.trend.slopePerDecade), fillOpacity: trendOpacity(entry.trend) };
  };

  const cellRect = ({ bbox: [west, south, east, north] }) => {
    const [x0, y0] = projection([west, north]);
    const [x1, y1] = projection([east, south]);
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  return (
    <svg width={width} height={height} className="pointer-events-none absolute inset-0" aria-hidden="true">
      {showOcean && (
        <g>
          {oceanRegions.map((region) => {
            const fill = fillProps(region);
            return fill && <rect key={region.id} {...cellRect(region)} {...fill} />;
          })}
        </g>
      )}
      {showLand && (
        <g>
          {landRegions.map((region) => {
            const fill = fillProps(region);
            return fill && <path key={region.id} d={path(region.feature)} {...fill} />;
          })}
        </g>
      )}
    </svg>
  );
}

export default TrendChoroplethLayer;
