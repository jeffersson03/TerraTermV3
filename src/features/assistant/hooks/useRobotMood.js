import { useAuiState } from "@assistant-ui/react";
import { useEffect, useRef, useState } from "react";

const HAPPY_MS = 2600;

// Textos que acompañan a cada estado de la mascota.
export const MOOD_LABEL = {
  idle: "Esperando tu pregunta",
  listening: "Te escucho…",
  thinking: "Pensando…",
  speaking: "Respondiendo…",
  happy: "¡Listo!",
  error: "Algo falló",
};

/**
 * Traduce el estado del chat (assistant-ui) al estado de ánimo de la mascota:
 * error > respondiendo/pensando > feliz (unos segundos al terminar) > escuchando > esperando.
 */
export function useRobotMood() {
  const isRunning = useAuiState((s) => s.thread.isRunning);
  const last = useAuiState((s) => s.thread.messages.at(-1));
  const isTyping = useAuiState((s) => s.composer.text.trim().length > 0);

  const [celebrating, setCelebrating] = useState(false);
  const wasRunning = useRef(false);

  const lastIsAssistant = last?.role === "assistant";
  const failed = lastIsAssistant && last.status?.type === "incomplete" && last.status?.reason === "error";
  const hasText = lastIsAssistant && last.content.some((p) => p.type === "text" && p.text.trim());

  useEffect(() => {
    if (wasRunning.current && !isRunning && !failed) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), HAPPY_MS);
      wasRunning.current = isRunning;
      return () => clearTimeout(t);
    }
    if (isRunning) setCelebrating(false);
    wasRunning.current = isRunning;
  }, [isRunning, failed]);

  if (isRunning) return hasText ? "speaking" : "thinking";
  if (failed) return "error";
  if (celebrating) return "happy";
  if (isTyping) return "listening";
  return "idle";
}
