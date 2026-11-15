import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
  // import.meta.url en lugar de __dirname: el proyecto es ESM ("type": "module")
  // y ESLint no reconoce __dirname como global.
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // En desarrollo, /api se reenvía al servidor del asistente IA (server/index.js, puerto 3001).
  server: { proxy: { "/api": "http://localhost:3001" } },
});
