// Servidor mínimo del asistente: recibe la conversación y devuelve la respuesta en streaming.
// La API key vive SOLO aquí (archivo .env), nunca en el navegador.
import "dotenv/config";
import express from "express";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "../src/features/assistant/prompts/systemPrompt.js";

const PORT = Number(process.env.PORT) || 3001;
const PROVIDER = (process.env.AI_PROVIDER || "google").toLowerCase();

// Modelos por defecto: cámbialos en .env (AI_MODEL) si tu proveedor usa otro nombre.
const PROVIDERS = {
  groq: {
    key: process.env.GROQ_API_KEY,
    model: (id) => createGroq({ apiKey: process.env.GROQ_API_KEY })(id),
    defaultModel: "llama-3.3-70b-versatile",
  },
  google: {
    key: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    model: (id) => createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })(id),
    defaultModel: "gemini-3.5-flash-lite",
  },
  openai: {
    key: process.env.OPENAI_API_KEY,
    model: (id) => createOpenAI({ apiKey: process.env.OPENAI_API_KEY })(id),
    defaultModel: "gpt-4o-mini",
  },
};

const provider = PROVIDERS[PROVIDER];
const DEMO_MODE = !provider || !provider.key;
const MODEL_ID = process.env.AI_MODEL || provider?.defaultModel;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, mode: DEMO_MODE ? "demo" : "ia", provider: PROVIDER, model: DEMO_MODE ? null : MODEL_ID });
});

app.post("/api/chat", async (req, res) => {
  const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  if (messages.length === 0) return res.status(400).json({ error: "Faltan mensajes" });

  if (DEMO_MODE) return streamDemo(res, messages);

  // Cancelamos si el usuario cierra el chat o si el modelo tarda demasiado.
  const abort = new AbortController();
  res.on("close", () => abort.abort());
  const timer = setTimeout(() => abort.abort(new Error("timeout")), TIMEOUT_MS);

  let started = false;
  try {
    const result = streamText({
      model: provider.model(MODEL_ID),
      system: withContext(SYSTEM_PROMPT, req.body?.context),
      messages,
      maxRetries: 1,
      abortSignal: abort.signal,
    });

    for await (const part of result.fullStream) {
      if (part.type === "error") throw part.error;
      if (part.type !== "text-delta" || !part.text) continue;
      if (!started) {
        started = true;
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      res.write(part.text);
    }
    if (!started) throw new Error("El modelo respondió vacío");
    res.end();
  } catch (err) {
    if (res.destroyed) return; // el usuario cerró el chat
    const message = friendlyError(err);
    console.error(`[asistente] Error del proveedor (${MODEL_ID}):`, err?.statusCode ?? "", err?.message ?? err);
    if (!started) res.status(502).json({ error: message });
    else res.end(`\n\n[${message}]`);
  } finally {
    clearTimeout(timer);
  }
});

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 30000;
const MAX_CONTEXT_CHARS = 2000;

// Anexa al prompt el estado de la interfaz que manda el cliente (vista, país, zonas, variable, periodo).
// Se trata como contexto, no como datos medidos; si no es un objeto válido se ignora.
function withContext(system, context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) return system;
  const text = JSON.stringify(context).slice(0, MAX_CONTEXT_CHARS);
  return `${system}

Contexto actual de la interfaz (lo que el usuario está viendo; NO son mediciones, no lo uses como cifra):
${text}`;
}

// Traduce los errores típicos del proveedor a un mensaje claro para el chat.
function friendlyError(err) {
  const status = err?.statusCode ?? err?.lastError?.statusCode;
  const text = String(err?.message ?? err?.cause ?? "");
  if (err?.name === "AbortError" || /timeout|aborted/i.test(text))
    return "El modelo tardó demasiado en responder. Intenta de nuevo o cambia AI_MODEL en .env.";
  if (status === 503 || /high demand|overloaded|unavailable/i.test(text))
    return "El modelo de IA está saturado en este momento. Intenta en unos segundos o cambia AI_MODEL en .env.";
  if (status === 429) return "Se alcanzó el límite de uso de la API. Espera un momento e inténtalo otra vez.";
  if (status === 404) return `El modelo "${MODEL_ID}" no existe para esta key. Revisa AI_MODEL en .env.`;
  if (status === 400 || status === 401 || status === 403) return "La API key no es válida o no tiene permisos. Revisa el archivo .env.";
  return "No se pudo obtener respuesta del modelo de IA.";
}

// Modo demo: simula una respuesta que se escribe poco a poco, para probar la interfaz sin key.
async function streamDemo(res, messages) {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply =
    `Modo demo (sin API key). Recibí tu pregunta: «${last}». ` +
    "Cuando configures una key en el archivo .env, aquí responderá el modelo de IA " +
    "explicando qué variable cambia, dónde, cuánto y si el cambio es significativo.";
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  for (const word of reply.split(" ")) {
    res.write(word + " ");
    await new Promise((r) => setTimeout(r, 35));
  }
  res.end();
}

app.listen(PORT, () => {
  const mode = DEMO_MODE ? "MODO DEMO (sin key)" : `${PROVIDER} · ${MODEL_ID}`;
  console.log(`[asistente] API lista en http://localhost:${PORT}  →  ${mode}`);
});
