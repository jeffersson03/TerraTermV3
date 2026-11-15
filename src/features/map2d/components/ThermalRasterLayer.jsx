import { useEffect, useRef } from "react";
import { useThermalRaster } from "@/features/map2d/hooks/useThermalRaster";

// Capa ráster: dibuja el mapa térmico del área visible escalado al
// rectángulo proyectado del bbox (la proyección equirectangular es lineal).
function ThermalRasterLayer({ projection, viewBbox, map2d }) {
  const canvasRef = useRef(null);
  const { canvas: raster, isLoading } = useThermalRaster({ viewBbox, map2d });

  const [west, south, east, north] = viewBbox;
  const [x0, y0] = projection([west, north]);
  const [x1, y1] = projection([east, south]);
  const width = Math.max(1, x1 - x0);
  const height = Math.max(1, y1 - y0);

  useEffect(() => {
    const target = canvasRef.current;
    if (!target || !raster) return;
    const ratio = window.devicePixelRatio || 1;
    target.width = Math.round(width * ratio);
    target.height = Math.round(height * ratio);
    const context = target.getContext("2d");
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(raster, 0, 0, target.width, target.height);
  }, [raster, width, height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute transition-opacity duration-500 ${isLoading || !raster ? "opacity-0" : "opacity-90"}`}
      style={{ left: x0, top: y0, width, height }}
    />
  );
}

export default ThermalRasterLayer;
