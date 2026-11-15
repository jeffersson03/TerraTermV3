import { AnimatePresence, motion } from "framer-motion";
import { useRegionTrend } from "@/features/analysis/hooks/useRegionTrend";
import { useFiltersStore } from "@/stores/useFiltersStore";
import { getVariable } from "@/constants/variables";
import { formatSigned } from "@/utils/formatValues";

const DIRECTION_ICON = { increase: "▲", decrease: "▼", none: "■" };

// Variable que se muestra en la zona: la elegida si aplica a la zona; si no, la primera de la zona
// (misma regla que CellPanel, así la etiqueta y el panel muestran el mismo dato).
function resolveVariable(region, selectedVariableId) {
  return getVariable(region.variables.includes(selectedVariableId) ? selectedVariableId : region.variables[0]);
}

// Tendencia real de la zona (NASA POWER) junto a su nombre. Cambia con la variable y el periodo.
// Comparte la consulta con el panel (powerService une las peticiones iguales y guarda la respuesta).
function TrendValue({ region }) {
  const selectedVariableId = useFiltersStore((state) => state.variableId);
  const period = useFiltersStore((state) => state.period);
  const variable = resolveVariable(region, selectedVariableId);
  const { trend, isLoading, error, isEmpty } = useRegionTrend({ region, variableId: variable?.id, period });

  if (!variable) return null;
  if (isLoading) return <span className="animate-pulse text-ink-muted"> · …</span>;
  if (error || isEmpty || trend?.slopePerDecade == null) return <span className="text-ink-muted"> · sin datos</span>;

  return (
    <span className={trend.isSignificant ? "text-ink" : "text-ink-muted"} title={trend.isSignificant ? "Tendencia significativa (p < 0,05)" : "Tendencia no significativa"}>
      {" · "}
      <span aria-hidden="true">{DIRECTION_ICON[trend.direction]}</span> {formatSigned(trend.slopePerDecade)} {variable.unit}/déc
    </span>
  );
}

// Etiquetas "A · Piura · ▲ +0,31 °C/déc" sobre las zonas seleccionadas, con su color de ranura.
// Cerca del borde derecho la etiqueta se dibuja hacia la izquierda para no quedar cortada.
const FLIP_AT = 0.55;

function SelectionLabels({ projection, width, selectedRegions }) {
  return (
    <AnimatePresence>
      {selectedRegions.map((region) => {
        const [x, y] = projection([region.center.lon, region.center.lat]);
        const side = width && x > width * FLIP_AT ? "right-4" : "left-4";
        return (
          <motion.div
            key={region.id}
            data-sensor={region.sensorId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <span className="relative flex h-3 w-3 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-sensor-accent opacity-60" />
              <span className="h-2 w-2 rounded-full bg-sensor-accent" />
            </span>
            <span className={`absolute ${side} top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-sensor-accent/60 bg-space-950/90 px-2.5 py-0.5 text-xs text-sensor-accent`}>
              <span className="font-mono">{region.marker}</span> · {region.label}
              <span className="font-mono tabular-nums">
                <TrendValue region={region} />
              </span>
            </span>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

export default SelectionLabels;
