import { moodLabelKey, useRobotMood } from "../hooks/useRobotMood";
import { useT } from "@/i18n/useT";
import RobotMascot from "./RobotMascot";
import Thread from "./Thread";

// Chat del asistente dentro de la pestaña «Asistente» del dock lateral.
// Ocupa todo el alto disponible; la lista de mensajes hace su propio scroll.
function AssistantChat() {
  const mood = useRobotMood();
  const { t } = useT();
  const moodLabel = t(moodLabelKey(mood));

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col text-bot-ink">
      <header className="flex shrink-0 items-center gap-2.5 border-b border-hud-border px-4 py-2.5">
        <RobotMascot mood={mood} size={32} crop="bust" className="shrink-0" title={t("assistant.robot")} />
        <span className="flex items-center gap-2 text-sm font-semibold leading-tight text-white">
          {t("assistant.title")}
          {/* Estado: solo un punto (el robot ya muestra lo que hace); el texto queda para lectores de pantalla */}
          <span
            title={moodLabel}
            className={`size-1.5 rounded-full ${mood === "error" ? "bg-bot-accent" : mood === "idle" ? "bg-bot-ink-soft/50" : "animate-pulse bg-bot-accent-soft"}`}
          />
          <span className="sr-only" aria-live="polite">{moodLabel}</span>
        </span>
      </header>

      <div className="min-h-0 flex-1">
        <Thread />
      </div>
    </div>
  );
}

export default AssistantChat;
