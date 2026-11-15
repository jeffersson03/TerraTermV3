import { ComposerPrimitive, ErrorPrimitive, MessagePrimitive, ThreadPrimitive } from "@assistant-ui/react";
import MarkdownText from "./MarkdownText";
import "../styles/assistantScroll.css";

const SUGERENCIAS = [
  "¿Se está calentando el mar frente a Paita?",
  "¿Está bajando la humedad del suelo en Ica?",
  "¿Qué significa que un cambio sea significativo?",
];

// Lista de mensajes + caja para escribir. Todo hecho con las piezas (primitives) de assistant-ui.
function Thread() {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col">
      <ThreadPrimitive.Viewport className="bot-scroll flex flex-1 flex-col gap-2.5 overflow-y-auto py-3 pr-1.5 pl-3.5">
        <ThreadPrimitive.Empty>
          <div className="flex flex-col gap-3">
            <p className="text-sm leading-relaxed text-bot-ink-soft">
              <span className="font-semibold text-white">¡Hola! 👋</span> Pregúntame qué está cambiando en tu zona:
              temperatura, lluvia, vegetación o glaciares.
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGERENCIAS.map((texto) => (
                <ThreadPrimitive.Suggestion
                  key={texto}
                  prompt={texto}
                  send
                  className="rounded-lg border border-white/5 bg-bot-navy/25 px-3 py-2 text-left text-[13px] text-bot-ink/90 transition hover:bg-white/10 hover:text-white"
                >
                  {texto}
                </ThreadPrimitive.Suggestion>
              ))}
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages>
          {({ message }) => (message.role === "user" ? <UserMessage /> : <AssistantMessage />)}
        </ThreadPrimitive.Messages>
      </ThreadPrimitive.Viewport>

      <Composer />
      <p className="-mt-1 pb-2 text-center text-[10.5px] text-bot-ink-soft/55">Fuente: datos NASA · respuestas generadas por IA</p>
    </ThreadPrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="max-w-[85%] self-end whitespace-pre-wrap rounded-xl rounded-br-sm border border-bot-accent-soft/30 bg-bot-accent/40 px-3 py-1.5 text-[13px] text-white backdrop-blur-sm">
      <MessagePrimitive.Parts />
    </MessagePrimitive.Root>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="max-w-[94%] self-start rounded-xl rounded-bl-sm border border-white/5 bg-bot-navy/30 px-3 py-2 text-[13px] leading-relaxed text-bot-ink">
      <MessagePrimitive.Parts components={{ Text: MarkdownText }} />
      <MessagePrimitive.Error>
        <ErrorPrimitive.Root className="mt-1 text-xs font-medium text-bot-accent-soft">
          <ErrorPrimitive.Message />
        </ErrorPrimitive.Root>
      </MessagePrimitive.Error>
    </MessagePrimitive.Root>
  );
}

function Composer() {
  return (
    <ComposerPrimitive.Root className="m-2.5 flex items-end gap-1.5 rounded-xl bg-bot-navy/30 p-1 ring-1 ring-white/10 transition focus-within:ring-bot-accent-soft/50">
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Escribe tu pregunta…"
        aria-label="Pregunta para el asistente"
        className="max-h-28 min-h-8 flex-1 resize-none bg-transparent px-2.5 py-1.5 text-[13px] text-bot-ink placeholder:text-bot-ink-soft/60 focus:outline-none"
      />
      <ComposerPrimitive.Send
        aria-label="Enviar"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-bot-accent text-white transition hover:bg-bot-accent-soft disabled:bg-transparent disabled:text-bot-ink-soft/40"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

export default Thread;
