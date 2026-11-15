import { RotateCw } from "lucide-react";
import HudPanel from "@/components/Hud/HudPanel";
import HudButton from "@/components/Hud/HudButton";
import ColorLegend from "@/components/Hud/ColorLegend";
import StatusBadge from "@/components/Hud/StatusBadge";
import { TREND_PALETTE, TREND_RANGE_C_PER_DECADE } from "@/constants/palettes";
import { useTrendMapStore } from "@/features/map2d/hooks/useTrendMapStore";
import { TREND_OPACITY } from "@/features/map2d/utils/trendColor";

const SCOPE_TEXT = {
  both: "Departamentos y celdas de mar",
  land: "Departamentos (temperatura de la superficie terrestre)",
  ocean: "Celdas de mar (temperatura de la superficie del mar)",
};

function OpacityKey({ opacity, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className="h-2.5 w-4 rounded-[2px] bg-[#ef8a62]" style={{ opacity }} />
      {label}
    </span>
  );
}

// Leyenda del mapa de tendencia térmica real (abajo a la izquierda del mapa 2D).
function TrendLegendPanel({ scope }) {
  const status = useTrendMapStore((state) => state.status);
  const progress = useTrendMapStore((state) => state.progress);
  const period = useTrendMapStore((state) => state.period);
  const retry = useTrendMapStore((state) => state.retry);

  return (
    <div aria-live="polite" className="absolute bottom-4 left-4 z-20 w-72 max-w-[calc(100%-2rem)]">
      <HudPanel as="aside" title="Tendencia térmica real" actions={<StatusBadge kind="estimate" />}>
        <div className="space-y-2">
          <ColorLegend palette={TREND_PALETTE} range={TREND_RANGE_C_PER_DECADE} unit="°C/déc" />

          {status === "loading" && (
            <p className="font-mono text-[11px] text-ink-secondary">
              Descargando NASA POWER… {progress.total ? `${progress.done}/${progress.total}` : ""}
            </p>
          )}
          {status === "error" && (
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] text-ink-secondary">No se pudo descargar la tendencia.</p>
              <HudButton variant="ghost" icon={RotateCw} onClick={retry}>
                Reintentar
              </HudButton>
            </div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-ink-muted">
            <OpacityKey opacity={TREND_OPACITY.significant} label="significativa" />
            <OpacityKey opacity={TREND_OPACITY.notSignificant} label="no significativa" />
          </div>

          <p className="text-[11px] text-ink-muted">
            {SCOPE_TEXT[scope]}
            {period ? ` · ${period.from}–${period.to}` : ""}. Pendiente de Sen por década; significancia con Mann-Kendall (p &lt; 0,05).
          </p>
          <p className="text-[11px] text-ink-muted">Fuente: NASA POWER (MERRA-2) · TS · rejilla 0,5° × 0,625°, media de los puntos de cada zona.</p>
        </div>
      </HudPanel>
    </div>
  );
}

export default TrendLegendPanel;
