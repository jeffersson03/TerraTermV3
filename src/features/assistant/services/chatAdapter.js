// Servicio que conecta assistant-ui con nuestro backend (/api/chat).
// Separado de los componentes visuales, como pide la guía del proyecto.

import { buildAssistantContext } from "../utils/buildAssistantContext";
import { getLang } from "@/i18n/languageStore";
import { t } from "@/i18n/useT";

const API_URL = "/api/chat";

// El contexto es opcional: si falla al armarse, el chat sigue funcionando sin él.
function safeContext() {
  try {
    return buildAssistantContext();
  } catch {
    return null;
  }
}

// assistant-ui guarda cada mensaje como una lista de "partes"; el backend solo necesita texto.
function toApiMessages(messages) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n"),
  }));
}

export const chatAdapter = {
  async *run({ messages, abortSignal }) {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `language`: el modelo responde en el idioma de la interfaz
      body: JSON.stringify({ messages: toApiMessages(messages), context: safeContext(), language: getLang() }),
      signal: abortSignal,
    });

    if (!response.ok || !response.body) {
      // El servidor manda { error: "mensaje claro" }; si no, asumimos que no está corriendo.
      const data = await response.json().catch(() => null);
      throw new Error(data?.error ?? t("assistant.unavailable"));
    }

    // Leemos la respuesta en streaming y vamos mostrando el texto acumulado.
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      yield { content: [{ type: "text", text }] };
    }
  },
};
