import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Info, RotateCw } from "lucide-react";
import { TREND_PALETTE, TREND_RANGE_C_PER_DECADE } from "@/constants/palettes";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";
import { TREND_OPACITY } from "@/features/map2d/utils/trendColor";
import { formatSigned } from "@/utils/formatValues";

const GRADIENT = `linear-gradient(to right, ${TREND_PALETTE.join(", ")})`;

function OpacityKey({ opacity, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="h-2.5 w-4 rounded-[2px] bg-[#ef8a62]" style={{ opacity }} />
      {label}
    </span>
  );
}

// Leyenda compacta del mapa de tendencia térmica real. Mismo ancho que el mapa dibujado
// (`style` con left/width lo calcula CountryMap2D). Detalles (significancia, periodo, fuente)
// en el botón «i» para no ocupar espacio.
function TrendLegendPanel({ style }) {
  const status = useTrendMapStore((state) => state.status);
  const progress = useTrendMapStore((state) => state.progress);
  const period = useTrendMapStore((state) => state.period);
  const retry = useTrendMapStore((state) => state.retry);
  const [showDetails, setShowDetails] = useState(false);
  const [min, max] = TREND_RANGE_C_PER_DECADE;

  return (
    <div aria-live="polite" className="absolute z-20 transition-[bottom] duration-300" style={style}>
      <AnimatePresence>
        {showDetails && (
          <motion.div
            id="trend-legend-details"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-2 w-full space-y-1.5 rounded-md border border-hud-border bg-space-900/95 p-3 text-[11px] text-ink-muted shadow-xl shadow-black/50 backdrop-blur-md"
          >
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
              <OpacityKey opacity={TREND_OPACITY.significant} label="significativa (p < 0,05)" />
              <OpacityKey opacity={TREND_OPACITY.notSignificant} label="no significativa" />
            </div>
            <p>
              Cambio de la temperatura de superficie por década{period ? `, ${period.from}–${period.to}` : ""}.
            </p>
            <p>Fuente: NASA POWER (MERRA-2) · TS · rejilla 0,5° × 0,625°.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 rounded-md border border-hud-border bg-space-900/90 px-2.5 py-1.5 backdrop-blur-md">
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-secondary">°C/déc</span>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-muted">{formatSigned(min, 1)}</span>
        <div className="relative h-2 min-w-0 flex-1 rounded-full" style={{ background: GRADIENT }} role="img" aria-label={`Escala de tendencia de ${min} a ${max} °C por década`}>
          {status === "loading" && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-space-950/70 font-mono text-[9px] text-ink">
              NASA POWER {progress.total ? `${progress.done}/${progress.total}` : "…"}
            </span>
          )}
        </div>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-muted">{formatSigned(max, 1)}</span>

        {status === "error" ? (
          <button
            type="button"
            onClick={retry}
            aria-label="Reintentar la descarga de la tendencia"
            className="flex size-8 shrink-0 items-center justify-center rounded text-sensor-accent hover:bg-space-800"
          >
            <RotateCw aria-hidden="true" className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowDetails((value) => !value)}
            aria-expanded={showDetails}
            aria-controls="trend-legend-details"
            aria-label="Detalles de la leyenda"
            className={`flex size-8 shrink-0 items-center justify-center rounded transition-colors hover:bg-space-800 ${showDetails ? "text-sensor-accent" : "text-ink-muted"}`}
          >
            <Info aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default TrendLegendPanel;
