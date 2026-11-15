import { AnimatePresence, motion } from "framer-motion";
import HudPanel from "@/components/Hud/HudPanel";
import DomainEmblem from "@/features/globe/components/DomainEmblem";
import DomainSwitcher from "@/features/globe/components/DomainSwitcher";
import LayerInfo from "@/features/globe/components/LayerInfo";
import { describeLayer } from "@/features/globe/utils/describeLayer";
import { getSensor } from "@/constants/sensors";

const SWAP = { duration: 0.25, ease: [0.22, 1, 0.36, 1] };

// Consola del sensor (solo en el globo 3D): une en una sola pieza el selector
// de vista y la capa activa. Emblema animado + nombre de la vista arriba,
// selector en medio y leyenda/fuente abajo. Al cambiar de vista cambian el
// emblema, el acento y el contenido con una transición corta.
function SensorConsole({ domain, onChange }) {
  const sensor = getSensor(domain);
  const layer = describeLayer(sensor, "globe");

  return (
    <div data-sensor={domain} className="w-[24rem] max-w-[calc(100vw-2rem)]">
      <HudPanel as="aside" className="shadow-2xl shadow-black/60">
        <div className="flex items-center gap-3">
          <DomainEmblem domain={domain} size={56} />
          <div className="min-w-0 flex-1" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={domain}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={SWAP}
              >
                <p className="font-mono text-xs tracking-wider text-sensor-accent">
                  {sensor.label}
                  {sensor.sensor && <span className="text-ink-muted"> // {sensor.sensor}</span>}
                </p>
                <p className="truncate text-sm font-semibold text-ink">{layer.title}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="my-3 border-y border-hud-border py-2">
          <DomainSwitcher domain={domain} onChange={onChange} variant="embedded" pillId="console-domain-pill" />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={domain} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={SWAP}>
            {/* Solo la escala de color: sin fuente ni nota de la textura (limpieza visual del globo) */}
            <LayerInfo layer={layer} showSource={false} />
          </motion.div>
        </AnimatePresence>
      </HudPanel>
    </div>
  );
}

export default SensorConsole;
