import { MOOD_LABEL, useRobotMood } from "../hooks/useRobotMood";
import RobotMascot from "./RobotMascot";
import Thread from "./Thread";

// Chat del asistente dentro de la pestaña «Asistente» del dock lateral.
// Ocupa todo el alto disponible; la lista de mensajes hace su propio scroll.
function AssistantChat() {
  const mood = useRobotMood();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col text-bot-ink">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-hud-border px-4 py-2.5">
        <RobotMascot mood={mood} size={32} crop="bust" className="shrink-0" />
        <span className="flex items-center gap-2 text-sm font-semibold leading-tight text-white">
          Asistente TerraTerm
          {/* Estado: solo un punto (el robot ya muestra lo que hace); el texto queda para lectores de pantalla */}
          <span
            title={MOOD_LABEL[mood]}
            className={`size-1.5 rounded-full ${mood === "error" ? "bg-bot-accent" : mood === "idle" ? "bg-bot-ink-soft/50" : "animate-pulse bg-bot-accent-soft"}`}
          />
          <span className="sr-only" aria-live="polite">{MOOD_LABEL[mood]}</span>
        </span>
      </header>

      <div className="min-h-0 flex-1">
        <Thread />
      </div>
    </div>
  );
}

export default AssistantChat;
