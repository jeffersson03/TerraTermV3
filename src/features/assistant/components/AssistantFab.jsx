import { useRobotMood } from "../hooks/useRobotMood";
import RobotMascot from "./RobotMascot";

/**
 * Robot flotante: acceso rápido al asistente. Al pulsarlo abre el chat en el dock lateral
 * (pestaña «Asistente»), así el chat nunca se superpone con el panel de información.
 *
 * position: clases de Tailwind para ubicar el robot (cámbialo si choca con otra barra).
 * hidden:   oculta el robot (p. ej. cuando el dock ya está abierto).
 * onOpen:   abre el chat.
 * En pantallas pequeñas no se muestra: el asistente se abre desde el menú (hamburguesa).
 */
function AssistantFab({ position = "right-6 bottom-6", hidden = false, onOpen }) {
  const mood = useRobotMood();
  if (hidden) return null;

  return (
    <div className={`fixed z-40 hidden sm:block ${position}`}>
      <button
        type="button"
        onClick={onOpen}
        aria-label="Abrir asistente"
        className="rb-hover-host group relative flex cursor-pointer flex-col items-center outline-none"
      >
        {/* Globo de texto al pasar el mouse */}
        <span className="pointer-events-none absolute top-3 right-[calc(100%+4px)] translate-x-1 rounded-md border border-bot-teal bg-bot-navy/95 px-2.5 py-1 font-mono text-[11px] tracking-wider whitespace-nowrap text-bot-ink uppercase opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:opacity-100">
          ¿Te ayudo?
        </span>

        <span className="rb-fab block transition-transform group-hover:scale-105 group-active:scale-95 group-focus-visible:scale-105">
          <RobotMascot mood={mood} size={80} title="Asistente" />
        </span>
        {/* Sombra/luz en el piso que acompaña la levitación */}
        <span className="rb-fab-shadow -mt-3 h-2.5 w-14 rounded-full bg-bot-accent-soft/50 blur-[6px]" aria-hidden="true" />
      </button>
    </div>
  );
}

export default AssistantFab;
