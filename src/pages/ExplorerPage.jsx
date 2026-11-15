import { AnimatePresence, motion } from "framer-motion";
import SideDock from "@/features/dock/components/SideDock";
import AnalysisLauncher from "@/features/dock/components/AnalysisLauncher";
import { useDockSync } from "@/features/dock/hooks/useDockSync";
import GlobeCanvas from "@/features/globe/components/GlobeCanvas";
import DomainSwitcher from "@/features/globe/components/DomainSwitcher";
import SensorConsole from "@/features/globe/components/SensorConsole";
import HoverProbe from "@/features/probe/components/HoverProbe";
import { useDomainShortcut } from "@/features/globe/hooks/useDomainShortcut";
import CountryMap2D from "@/features/map2d/components/CountryMap2D";
import MapBreadcrumb from "@/features/map2d/components/MapBreadcrumb";
import FlowTimeline from "@/features/explorer/components/FlowTimeline";
import { useExplorerStore } from "@/features/explorer/hooks/useExplorerStore";
import { useCountryEntry } from "@/features/explorer/hooks/useCountryEntry";
import { useSelectionPruning } from "@/features/explorer/hooks/useSelectionPruning";
import { useFlowKeyboard } from "@/features/explorer/hooks/useFlowKeyboard";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { getCountry } from "@/constants/countries";

const FADE = { duration: 0.6, ease: [0.22, 1, 0.36, 1] };

// Página del explorador:
//   1. Globo completo. Clic en un país → vuelo de cámara.
//   2. Fundido al mapa 2D fijo del país; aparece la barra de pasos y (en escritorio) el dock en «Zona».
//   3. "← Mundo" o Escape: fundido inverso y la cámara se aleja.
// HUD: en el globo, una sola consola (emblema + selector + capa); en el 2D,
// selector arriba y capa abajo. La sonda que sigue al cursor es común a ambos.
// Dock (botón «Ver análisis» en el 2D; robot en el globo): Zona · Tendencias · Asistente, uno a la vez.
// En móvil/tablet aparece debajo del mapa; en escritorio, como columna derecha.
function ExplorerPage() {
  const level = useExplorerStore((state) => state.level);
  const countryId = useExplorerStore((state) => state.countryId);
  const selectedRegions = useExplorerStore((state) => state.selectedRegions);
  const notice = useExplorerStore((state) => state.notice);
  const domain = useTelemetryStore((state) => state.domain);
  const setDomain = useTelemetryStore((state) => state.setDomain);
  const { handleCountryClick, handleExit } = useCountryEntry();
  useDomainShortcut();
  useSelectionPruning();
  useFlowKeyboard();
  useDockSync(level);

  const isGlobe = level === "globe";
  const country = getCountry(countryId);

  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Móvil/tablet: mapa arriba y dock debajo. Escritorio: mapa y dock en columnas */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* @container: el HUD se acomoda al ancho real del mapa (cambia cuando el dock está abierto) */}
        <section className="@container relative min-h-0 min-w-0 flex-1 overflow-hidden" aria-label={isGlobe ? "Globo terráqueo interactivo" : `Mapa de ${country?.name}`}>
          {/* Nivel 1: globo (sigue montado pero deja de renderizar al ocultarse) */}
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: isGlobe ? 1 : 0 }}
            transition={FADE}
            style={{ pointerEvents: isGlobe ? "auto" : "none" }}
          >
            <GlobeCanvas isActive={isGlobe} onCountryClick={handleCountryClick} />
          </motion.div>

          {/* Nivel 2: mapa 2D del país */}
          <AnimatePresence>
            {!isGlobe && countryId && (
              <motion.div
                key={countryId}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={FADE}
              >
                <CountryMap2D countryId={countryId} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD del globo: consola única (emblema + selector + capa) */}
          <AnimatePresence>
            {isGlobe && (
              <motion.div
                key="sensor-console"
                className="absolute bottom-4 left-4 z-20"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={FADE}
              >
                <SensorConsole domain={domain} onChange={setDomain} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* HUD del mapa 2D: ruta a la izquierda y selector de vista en la esquina superior derecha */}
          <AnimatePresence>
            {!isGlobe && (
              <motion.div
                key="map-switcher"
                className="absolute right-3 top-3 z-20 sm:right-4 sm:top-4"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={FADE}
              >
                <DomainSwitcher domain={domain} onChange={setDomain} variant="corner" />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!isGlobe && country && (
              <motion.div
                className="absolute left-3 top-3 z-20 max-w-[calc(100%-10rem)] sm:left-4 sm:top-4 @3xl:max-w-[calc(100%-26rem)]"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
              >
                <MapBreadcrumb countryName={country.name} selectedRegions={selectedRegions} onBack={handleExit} />
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {notice && (
              <motion.p
                role="status"
                className="absolute left-1/2 top-16 z-20 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-full border text-center border-hud-border bg-space-900/90 px-4 py-1.5 text-xs text-ink-secondary"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                {notice}
              </motion.p>
            )}
          </AnimatePresence>

          {/* En el mapa 2D la leyenda la pone CountryMap2D (tendencia térmica real) */}
        </section>

        {/* Sonda que sigue al cursor (globo y mapa 2D); posición fija en la ventana */}
        <HoverProbe />

        <SideDock level={level} />
      </div>

      {/* La barra de pasos solo existe en el mapa 2D */}
      <AnimatePresence>
        {!isGlobe && (
          <motion.div className="relative" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={FADE}>
            {/* «Ver análisis»: sobre el borde entre el mapa y la barra de pasos (zona del pulgar) */}
            <AnalysisLauncher className="absolute -top-7 right-3 z-30 sm:right-4" />
            <FlowTimeline />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExplorerPage;
