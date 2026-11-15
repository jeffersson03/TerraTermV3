import HudPanel from "@/components/Hud/HudPanel";
import StatusBadge from "@/components/Hud/StatusBadge";
import LayerInfo from "@/features/globe/components/LayerInfo";
import { describeLayer } from "@/features/globe/utils/describeLayer";
import { getSensor } from "@/constants/sensors";

// Tarjeta HUD de la capa activa (mapa 2D): título, tipo de dato, leyenda(s),
// fuente y limitaciones. En el globo se usa SensorConsole en su lugar.
function LayerStatusPanel({ domain, level = "globe" }) {
  const layer = describeLayer(getSensor(domain), level);

  return (
    <div aria-live="polite" className="absolute bottom-4 left-4 z-20 hidden w-72 max-w-[calc(100%-2rem)] sm:block">
      <HudPanel as="aside" title={layer.title} actions={<StatusBadge kind={layer.kind} />}>
        <LayerInfo layer={layer} />
      </HudPanel>
    </div>
  );
}

export default LayerStatusPanel;
