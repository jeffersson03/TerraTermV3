// Lógica del asistente, compartida por:
//   - server/index.js  → servidor Express local (npm run dev)
//   - api/chat.js, api/health.js → funciones serverless en Vercel
// Ambos entornos dan (req, res) de Node con req.body ya parseado y res.status().json().
// La API key vive SOLO en el servidor (.env local o variables de entorno de Vercel).
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { SYSTEM_PROMPT } from "../src/features/assistant/prompts/systemPrompt.js";

const MAX_CONTEXT_CHARS = 2000;
const MAX_MESSAGES = 40; // evita conversaciones enormes en una sola petición

// Modelos por defecto: cámbialos con AI_MODEL si tu proveedor usa otro nombre.
const PROVIDERS = {
  groq: {
    keyName: "GROQ_API_KEY",
    model: (key, id) => createGroq({ apiKey: key })(id),
    defaultModel: "llama-3.3-70b-versatile",
  },
  google: {
    keyName: "GOOGLE_GENERATIVE_AI_API_KEY",
    model: (key, id) => createGoogleGenerativeAI({ apiKey: key })(id),
    defaultModel: "gemini-3.5-flash-lite",
  },
  openai: {
    keyName: "OPENAI_API_KEY",
    model: (key, id) => createOpenAI({ apiKey: key })(id),
    defaultModel: "gpt-4o-mini",
  },
};

// Se lee en cada petición (no al importar): así funciona igual con dotenv y en Vercel.
export function getConfig() {
  const providerName = (process.env.AI_PROVIDER || "google").toLowerCase();
  const provider = PROVIDERS[providerName];
  const key = provider ? process.env[provider.keyName] : undefined;
  return {
    providerName,
    provider,
    key,
    demoMode: !provider || !key,
    modelId: process.env.AI_MODEL || provider?.defaultModel,
    timeoutMs: Number(process.env.AI_TIMEOUT_MS) || 30000,
  };
}

// Anexa al prompt el estado de la interfaz que manda el cliente (vista, país, zonas, variable, periodo).
// Se trata como contexto, no como datos medidos; si no es un objeto válido se ignora.
function withContext(system, context) {
  if (!context || typeof context !== "object" || Array.isArray(context)) return system;
  const text = JSON.stringify(context).slice(0, MAX_CONTEXT_CHARS);
  return `${system}

Contexto actual de la interfaz (lo que el usuario está viendo; NO son mediciones, no lo uses como cifra):
${text}`;
}

// Textos del servidor en los idiomas de la interfaz (el cliente manda `language`).
const SERVER_TEXT = {
  es: {
    languageRule: "Responde siempre en español.",
    timeout: "El modelo tardó demasiado en responder. Intenta de nuevo o cambia AI_MODEL.",
    busy: "El modelo de IA está saturado en este momento. Intenta en unos segundos o cambia AI_MODEL.",
    rateLimit: "Se alcanzó el límite de uso de la API. Espera un momento e inténtalo otra vez.",
    noModel: (id) => `El modelo "${id}" no existe para esta key. Revisa AI_MODEL.`,
    badKey: "La API key no es válida o no tiene permisos. Revisa .env (local) o las variables de entorno (Vercel).",
    generic: "No se pudo obtener respuesta del modelo de IA.",
    missingMessages: "Faltan mensajes",
    demo: (question) =>
      `Modo demo (sin API key). Recibí tu pregunta: «${question}». ` +
      "Cuando configures una key (archivo .env en local o variables de entorno en Vercel), aquí responderá " +
      "el modelo de IA explicando qué variable cambia, dónde, cuánto y si el cambio es significativo.",
  },
  en: {
    languageRule: "Always answer in English.",
    timeout: "The model took too long to answer. Try again or change AI_MODEL.",
    busy: "The AI model is overloaded right now. Try again in a few seconds or change AI_MODEL.",
    rateLimit: "The API usage limit was reached. Wait a moment and try again.",
    noModel: (id) => `The model "${id}" does not exist for this key. Check AI_MODEL.`,
    badKey: "The API key is invalid or lacks permissions. Check .env (local) or the environment variables (Vercel).",
    generic: "Could not get an answer from the AI model.",
    missingMessages: "Missing messages",
    demo: (question) =>
      `Demo mode (no API key). I received your question: “${question}”. ` +
      "Once you set a key (.env file locally or environment variables on Vercel), the AI model will answer here, " +
      "explaining which variable changes, where, by how much and whether the change is significant.",
  },
};

function pickLanguage(value) {
  return value === "en" ? "en" : "es";
}

// Traduce los errores típicos del proveedor a un mensaje claro para el chat.
function friendlyError(err, modelId, text) {
  const status = err?.statusCode ?? err?.lastError?.statusCode;
  const message = String(err?.message ?? err?.cause ?? "");
  if (err?.name === "AbortError" || /timeout|aborted/i.test(message)) return text.timeout;
  if (status === 503 || /high demand|overloaded|unavailable/i.test(message)) return text.busy;
  if (status === 429) return text.rateLimit;
  if (status === 404) return text.noModel(modelId);
  if (status === 400 || status === 401 || status === 403) return text.badKey;
  return text.generic;
}

// Modo demo: simula una respuesta que se escribe poco a poco, para probar la interfaz sin key.
async function streamDemo(res, messages, text) {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply = text.demo(last);
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  for (const word of reply.split(" ")) {
    res.write(word + " ");
    await new Promise((resolve) => setTimeout(resolve, 35));
  }
  res.end();
}

// GET /api/health
export function handleHealth(_req, res) {
  const config = getConfig();
  res.status(200).json({
    ok: true,
    mode: config.demoMode ? "demo" : "ia",
    provider: config.providerName,
    model: config.demoMode ? null : config.modelId,
  });
}

// POST /api/chat → texto en streaming (text/plain); 400 sin mensajes; 502 con mensaje claro.
export async function handleChat(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Usa POST" });

  const text = SERVER_TEXT[pickLanguage(req.body?.language)];
  const messages = Array.isArray(req.body?.messages) ? req.body.messages.slice(-MAX_MESSAGES) : [];
  if (messages.length === 0) return res.status(400).json({ error: text.missingMessages });

  const config = getConfig();
  if (config.demoMode) return streamDemo(res, messages, text);

  // Cancelamos si el usuario cierra el chat o si el modelo tarda demasiado.
  const abort = new AbortController();
  res.on("close", () => abort.abort());
  const timer = setTimeout(() => abort.abort(new Error("timeout")), config.timeoutMs);

  let started = false;
  try {
    const result = streamText({
      model: config.provider.model(config.key, config.modelId),
      system: `${withContext(SYSTEM_PROMPT, req.body?.context)}\n\n${text.languageRule}`,
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
    const message = friendlyError(err, config.modelId, text);
    console.error(`[asistente] Error del proveedor (${config.modelId}):`, err?.statusCode ?? "", err?.message ?? err);
    if (!started) res.status(502).json({ error: message });
    else res.end(`\n\n[${message}]`);
  } finally {
    clearTimeout(timer);
  }
}
