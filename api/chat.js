// Función serverless de Vercel: POST /api/chat (misma lógica que el servidor local).
import { handleChat } from "../server/chatHandler.js";

export default handleChat;
