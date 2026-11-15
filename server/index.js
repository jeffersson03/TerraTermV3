// Servidor LOCAL del asistente (npm run dev / npm run dev:api).
// En Vercel no se usa: allí responden las funciones de /api con la misma lógica (server/chatHandler.js).
// La API key vive SOLO en el servidor (archivo .env), nunca en el navegador.
import "dotenv/config";
import express from "express";
import { getConfig, handleChat, handleHealth } from "./chatHandler.js";

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", handleHealth);
app.post("/api/chat", handleChat);

app.listen(PORT, () => {
  const config = getConfig();
  const mode = config.demoMode ? "MODO DEMO (sin key)" : `${config.providerName} · ${config.modelId}`;
  console.log(`[asistente] API lista en http://localhost:${PORT}  →  ${mode}`);
});
