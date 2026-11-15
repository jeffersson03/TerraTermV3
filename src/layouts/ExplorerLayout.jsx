import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router";
import { ChevronUp } from "lucide-react";
import { useTelemetryStore } from "@/stores/useTelemetryStore";
import { getSensor } from "@/constants/sensors";

const HEADER_REVEAL_ZONE_PX = 64; // franja superior que muestra el HUD
const HEADER_HIDE_DELAY_MS = 500; // espera tras salir de la franja antes de ocultarlo


// Marco del explorador: barra superior HUD + área de trabajo a pantalla completa.
// `data-sensor` define la vista activa: todo lo que esté dentro usa sus colores.
// El dominio sale de useTelemetryStore (única fuente de verdad).
function ExplorerLayout() {
  const domain = useTelemetryStore((state) => state.domain);
  const sensor = getSensor(domain);

  // Estado de visibilidad del HUD
  const [headerVisible, setHeaderVisible] = useState(false);

  // Referencia del temporizador
  const hideTimer = useRef(null);

  // Limpiar temporizador (estable: solo usa refs)
  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  // Programar ocultamiento (estable: solo usa refs y el setter de estado)
  const scheduleHide = useCallback(() => {
    clearHideTimer();

    hideTimer.current = setTimeout(() => {
      hideTimer.current = null;
      setHeaderVisible(false);
    }, HEADER_HIDE_DELAY_MS);
  }, [clearHideTimer]);

  // Mostrar el HUD al acercarse al borde superior y ocultarlo al salir de esa franja
  useEffect(() => {
    const handlePointerMove = (event) => {
      if (event.clientY <= HEADER_REVEAL_ZONE_PX) {
        // Zona superior: mostrar HUD y cancelar cualquier ocultamiento pendiente
        clearHideTimer();
        setHeaderVisible(true);
        return;
      }

      // Fuera de la zona: programar UNA sola vez. Si ya hay un temporizador
      // pendiente no se reinicia, así el HUD se oculta aunque el ratón siga moviéndose.
      if (headerVisible && !hideTimer.current) {
        scheduleHide();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      clearHideTimer();
    };
  }, [headerVisible, clearHideTimer, scheduleHide]);

  // Mostrar manualmente
  const revealHeader = () => {
    clearHideTimer();
    setHeaderVisible(true);
  };

  return (
    <div
      data-sensor={domain}
      className="
        relative flex h-dvh w-full
        flex-col overflow-hidden
        bg-space-950 text-ink
      "
    >
      {/* HEADER HUD */}
      <header
        onPointerEnter={revealHeader}
        onFocusCapture={revealHeader}
        className={`
          absolute inset-x-0 top-0 z-50
          flex h-12 shrink-0
          items-center justify-between
          border-b border-hud-border
          bg-space-900/90 backdrop-blur-md
          px-4

          transition-all duration-300 ease-out

          ${
            headerVisible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-full opacity-0 pointer-events-none"
          }
        `}
      >
        {/* Identidad */}
        <span
          className="
          text-sm font-semibold
          uppercase tracking-[0.08em]
        "
        >
          Terra<span className="text-sensor-accent">Term</span>
        </span>

        {/* Información del sensor */}
        <span
          className="
          font-mono text-xs tabular-nums
          text-ink-muted
        "
        >
          {sensor.label}
          {sensor.sensor && <span className="text-sensor-accent"> // {sensor.sensor}</span>}
          <span className="hidden sm:inline"> · {sensor.description}</span>
        </span>
      </header>

      {/* EDGE HINT */}
      <button
        type="button"
        onPointerEnter={revealHeader}
        onClick={revealHeader}
        aria-label="Mostrar encabezado HUD"
        aria-expanded={headerVisible}
        className={`
          absolute left-1/2 top-0 z-40
          -translate-x-1/2
          flex flex-col items-center
          transition-all duration-300 ease-out

          ${
            headerVisible
              ? "opacity-0 -translate-y-2 pointer-events-none"
              : "opacity-100 translate-y-0 pointer-events-auto"
          }
        `}
      >
        {/* Línea luminosa */}
        <span
          className="
          h-px w-screen
          bg-sensor-accent
          shadow-[0_0_8px_var(--sensor-accent)]
        "
        />

        {/* Pestaña central */}
        <span
          className="
            flex items-center gap-2
  rounded-b-sm
  border border-t-0 border-hud-border
  bg-space-900/95
  px-4 py-1.5
  font-mono text-[9px]
  tracking-widest
  text-sensor-accent
  shadow-lg
        "
        >
          <ChevronUp
            size={13}
            strokeWidth={2.5}
            className="animate-hud-indicator"
          />
        </span>
      </button>

      {/* ÁREA DE TRABAJO */}
      <main
        className="
        relative flex-1
        min-h-0 w-full
        overflow-hidden
      "
      >
        <Outlet />
      </main>
    </div>
  );
}

export default ExplorerLayout;
