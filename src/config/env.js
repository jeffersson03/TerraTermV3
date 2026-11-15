// Configuración de entorno del CLIENTE. Todo lo que empieza por VITE_ queda
// expuesto en el navegador: aquí NUNCA van claves privadas (IA, Earthdata…);
// esas viven en el backend/proxy.
//
// Variables (archivo .env.local, ver .env.example):
//   VITE_USE_MOCKS=true|false   → usar datos simulados (por defecto: true)
//   VITE_API_BASE_URL=…         → URL del backend/proxy propio (opcional)
const env = import.meta.env;

export const ENV = Object.freeze({
  useMocks: env.VITE_USE_MOCKS !== "false",
  apiBaseUrl: env.VITE_API_BASE_URL ?? "",
  isDev: env.DEV,
});
