import ColorLegend from "@/components/Hud/ColorLegend";
import { getVariable } from "@/constants/variables";
import { useT } from "@/i18n/useT";

// Contenido de la capa activa: leyenda(s), fuente y limitaciones.
// Lo comparten LayerStatusPanel (2D) y SensorConsole (3D).
// `layer`: resultado de utils/describeLayer.js
// `showSource`: false oculta las líneas de fuente y nota (consola del globo)
function LayerInfo({ layer, showSource = true }) {
  const { t, tc } = useT();
  const variables = layer.variableIds.map(getVariable).filter(Boolean);

  return (
    <div className="space-y-2">
      {variables.map((variable) => (
        <ColorLegend
          key={variable.id}
          title={variables.length > 1 ? tc("variables", variable.id, "shortLabel", variable.shortLabel) : undefined}
          palette={variable.palette}
          range={variable.range}
          unit={variable.unit}
        />
      ))}
      {showSource && <p className="text-[11px] text-ink-muted">{t("common.source")}: {layer.source}</p>}
      {showSource && <p className="text-[11px] text-ink-muted">{layer.note}</p>}
    </div>
  );
}

export default LayerInfo;
