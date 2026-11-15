# TerraTerm

## Correr el proyecto (web + asistente IA)

```bash
npm install
copy .env.example .env    # macOS/Linux: cp .env.example .env
npm run dev
```

- Pega tu key de Gemini en `.env` (`GOOGLE_GENERATIVE_AI_API_KEY`). Sácala en https://aistudio.google.com → **Get API key**. **Nunca subas `.env`** (ya está en `.gitignore`).
- `npm run dev` levanta la web (5173) y el servidor del asistente (3001) a la vez. Solo la web: `npm run dev:web`. Solo el servidor: `npm run dev:api`.
- Verifica el asistente en http://localhost:3001/api/health → `"mode":"ia"`. Sin key responde en **modo demo**.
- El asistente vive en `src/features/assistant/` (robot flotante + chat) y `server/index.js` (guarda la key y llama al modelo). El proxy `/api` de Vite es solo para desarrollo.
- `npm test` ejecuta los tests del análisis con datos reales (NASA POWER / IMERG).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
