// Función serverless de Vercel: GET /api/health (misma lógica que el servidor local).
import { handleHealth } from "../server/chatHandler.js";

export default handleHealth;
