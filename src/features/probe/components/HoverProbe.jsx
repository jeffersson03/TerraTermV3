import { motion } from "framer-motion";
import { getSensor } from "@/constants/sensors";
import { useHoverStore } from "@/stores/useHoverStore";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { useViewportSize } from "@/hooks/useViewportSize";
import { useProbeReading } from "@/features/probe/hooks/useProbeReading";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";
import { trendColor } from "@/features/map2d/utils/trendColor";
import { formatSigned } from "@/utils/formatValues";
import { formatLatitude, formatLongitude } from "@/utils/formatCoordinates";
import { formatNumber } from "@/utils/formatValues";
import { useT } from "@/i18n/useT";

const OFFSET = 18; // separación entre el cursor y la tarjeta
const CARD_SIZE = { width: 220, height: 84 }; // tamaño aproximado para no salir de pantalla
const SURFACE_KEY = { land: "probe.land", ocean: "probe.ocean" };

// Mira mínima alrededor del cursor (4 marcas con hueco central)
function Reticle({ x, y }) {
  return (
    <svg
      aria-hidden="true"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      className="pointer-events-none fixed z-50 text-sensor-accent"
      style={{ left: x - 14, top: y - 14 }}
    >
      <path d="M14 2v6M14 20v6M2 14h6M20 14h6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

// Sonda de exploración: sigue al cursor en el globo y en el mapa 2D.
// Muestra el lugar, la variable que colorea la vista activa en ese punto
// (con su color en la escala) y las coordenadas. Mismo componente, contenido
// distinto por vista: Classic (tierra o mar), Terra (solo tierra), Aqua (solo mar).
function HoverProbe() {
  const location = useHoverStore((state) => state.hoveredLocation);
  const domain = useTelemetryStore((state) => state.domain);
  const sensor = getSensor(domain);
  const reading = useProbeReading(location, sensor);
  // Mapa 2D: tendencia térmica real de la zona bajo el cursor (NASA POWER), si ya está calculada
  const regionTrend = useTrendMapStore((state) => (location?.regionId ? state.trends.get(location.regionId) : null))?.trend;
  const viewport = useViewportSize();
  const { t, locale } = useT();

  const isVisible = Boolean(location && location.screenX !== null);
  const x = location?.screenX ?? 0;
  const y = location?.screenY ?? 0;
  const flipX = x + OFFSET + CARD_SIZE.width > viewport.width;
  const flipY = y + OFFSET + CARD_SIZE.height > viewport.height;

  const placeName = location?.country ?? (reading ? t(SURFACE_KEY[reading.surface]) : "");

  // Sin animación de salida: al irse el cursor no hay posición a la que anclarla
  if (!isVisible) return null;

  return (
    <motion.div data-sensor={domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} aria-hidden="true">
      <Reticle x={x} y={y} />
      <div
        className="pointer-events-none fixed z-50 min-w-[11rem] max-w-[14rem] rounded-sm border border-hud-border border-l-2 border-l-sensor-accent bg-space-900/90 px-3 py-2 shadow-lg shadow-black/40 backdrop-blur-md"
        style={{
          left: flipX ? x - OFFSET - CARD_SIZE.width : x + OFFSET,
          top: flipY ? y - OFFSET - CARD_SIZE.height : y + OFFSET,
        }}
      >
        <p className="truncate text-sm font-semibold text-ink">{placeName}</p>

        {regionTrend?.slopePerDecade != null && (
          <p className="mt-1 flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-ink/20" style={{ background: trendColor(regionTrend.slopePerDecade) }} />
            <span className="text-sensor-accent">TS</span>
            <span className="text-ink">{formatSigned(regionTrend.slopePerDecade, 2, locale)} °C/{t("units.decadeShort")}</span>
            <span className="text-[10px] text-ink-muted">{regionTrend.isSignificant ? t("trend.significantShort") : t("trend.notSignificantShort")}</span>
          </p>
        )}

        {!regionTrend && reading?.variable && (
          <p className="mt-1 flex items-center gap-2 font-mono text-xs tabular-nums">
            <span className="h-2.5 w-2.5 shrink-0 rounded-[2px] ring-1 ring-ink/20" style={{ background: reading.color }} />
            <span className="text-sensor-accent">{reading.variable.shortLabel}</span>
            <span className="text-ink">
              {formatNumber(reading.value, 1, locale)} {reading.variable.unit}
            </span>          </p>
        )}

        <p className="mt-1 font-mono text-[10px] tabular-nums text-ink-muted">
          {formatLatitude(location.lat, locale)} · {formatLongitude(location.lon, locale)}
        </p>
      </div>
    </motion.div>
  );
}

export default HoverProbe;
