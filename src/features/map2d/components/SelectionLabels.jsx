import { AnimatePresence, motion } from "framer-motion";

// Etiquetas "A · Piura" sobre las zonas seleccionadas, con su color de ranura.
function SelectionLabels({ projection, selectedRegions }) {
  return (
    <AnimatePresence>
      {selectedRegions.map((region) => {
        const [x, y] = projection([region.center.lon, region.center.lat]);
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
            <span className="absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-sensor-accent/60 bg-space-950/90 px-2.5 py-0.5 text-xs text-sensor-accent">
              <span className="font-mono">{region.marker}</span> · {region.label}
            </span>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

export default SelectionLabels;
