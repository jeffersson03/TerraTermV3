# Plan de integración — Asistente IA en TerraTerm

> Documento para que **otra IA** (o una persona) integre el módulo de Asistente IA implementado en
> `TerraTermV2` dentro del **proyecto original completo** documentado en `integration.md`,
> **sin borrar ni reescribir el código existente**.
>
> Fecha: 2026-11-15 · Rama de origen: `features/asistente-ia` · Base de origen: `TerraTermV2`.

---

## 0. Resumen ejecutivo (leer primero)

1. `integration.md` describe el **proyecto original completo**: globo 3D, mapa 2D, flujo explorador,
   análisis estadístico, filtros, sonda, dashboard, alertas y una carpeta `assistant/` que **solo
   tenía `constants/mapActions.js`** (módulo sin empezar).
2. `TerraTermV2` **no es** el proyecto original: es una base reducida (solo el globo 3D) donde se
   implementó **desde cero el Asistente IA**. Comparado con `integration.md`, a V2 le faltan casi
   todos los módulos (stores, services, constants, UI kit, map2d, explorer, analysis, filters, probe).
3. La buena noticia: el asistente es **casi autónomo**. Se compone de **13 archivos nuevos** y
   **6 parches pequeños** en archivos compartidos. **No requiere borrar nada** del proyecto original.
4. La integración correcta es **“portar el asistente hacia el proyecto original”**, no “reemplazar el
   original por V2”. Reemplazar V2 por el original sería perder el 80 % del código.
5. Regla de oro: **copiar solo lo nuevo; aplicar los parches; nunca sobrescribir** `theme.css`,
   los stores, los catálogos ni el layout completo del original.

---

## 1. Las dos bases de código

| Aspecto | Proyecto original (`integration.md`) | TerraTermV2 (rama actual) |
|---|---|---|
| Alcance | Plataforma completa M1–M6 | Base mínima: globo + asistente |
| Globo 3D | 12 componentes + 3 hooks + 2 utils | 3 componentes + 1 util |
| Mapa 2D | `map2d/` completo | No existe |
| Flujo explorador | `explorer/` completo (8 paneles) | No existe |
| Análisis | `analysis/` completo | No existe |
| Filtros | `filters/` completo | No existe |
| Sonda | `probe/` completo | No existe |
| Asistente IA | Solo `constants/mapActions.js` | **Implementado completo (13 archivos)** |
| Stores | 6 stores (zustand) | Ninguno |
| Services | API, geo, texturas, mocks | Ninguno (solo el server nuevo) |
| Constants | 9 registros | Ninguno |
| UI kit | `Hud/` (9) + `charts/` (5) | Ninguno |
| Servidor IA | No existía | `server/index.js` (nuevo) |
| Sistema de diseño | `space-*`, `hud-*`, `sensor-*`, variantes `terra/aqua/classic` | `void/panel/terra/aqua` + `bot-*` del asistente |

**Conclusión:** hay dos sistemas de diseño y dos arquitecturas distintas. El asistente de V2 está
aislado por tokens propios (`bot-*`), lo que permite portarlo sin romper el diseño del original.

---

## 2. Comparativa de estructura

### 2.1 Árbol del proyecto original (`integration.md`)

```
TerraTerm/
├── .claude/ (CLAUDE.md, settings.json, skills/Design/SKILL.md)
├── assets-src/ (topo, previews, research)
├── public/ (geo/*, textures/*)
├── src/
│   ├── main.jsx · App.jsx · index.css
│   ├── config/env.js
│   ├── router/{appRouter.jsx, routePaths.js}
│   ├── layouts/ExplorerLayout.jsx
│   ├── pages/{ExplorerPage.jsx, RouteErrorPage.jsx}
│   ├── styles/theme.css
│   ├── constants/ (sensors, variables, countries, regions, periods,
│   │               dataKinds, palettes, thermalPalette, textures)
│   ├── stores/ (telemetry, map, filters, hover, assistant, alerts)
│   ├── services/ (environmentalDataService, api/, geospatial/, textures/, mocks/)
│   ├── hooks/ (useEnvironmentalData, useMediaQuery, useElementSize, useViewportSize)
│   ├── utils/ (formatCoordinates, formatValues, colorScale, keyboard)
│   ├── components/
│   │   ├── Hud/ (HudPanel, HudButton, StatTile, ColorLegend, SourceBadge,
│   │   │          StatusBadge, DataState, CoordinatePill, ReticleOverlay)
│   │   └── charts/ (chartRegistry, chartTheme, ChartBlock,
│   │                TimeSeriesChart, TrendSparkline)
│   └── features/
│       ├── globe/ (components 12, hooks 3, utils 2, constants 1)
│       ├── map2d/ (components 5, hooks 2, utils 2)
│       ├── explorer/ (components 8 + registry, hooks 5, utils 1, constants 1)
│       ├── analysis/ (components 3, hooks 1, utils 4)
│       ├── filters/ (components 3)
│       ├── probe/ (components 1, hooks 1)
│       └── assistant/ (constants/mapActions.js)   ← casi vacío
└── index.html · vite.config.js · eslint.config.js · package.json
    · .env.example · README.md · doc.md · plan.md · research.md
```

### 2.2 Árbol real de TerraTermV2

```
TerraTermV2/
├── .claude/ (CLAUDE.md, settings.json, skills/Design/SKILL.md)
├── server/
│   └── index.js                      ← NUEVO (backend IA)
├── src/
│   ├── main.jsx · App.jsx · index.css
│   ├── router/ · layouts/ · pages/
│   ├── styles/theme.css
│   ├── features/
│   │   ├── globe/ (EarthGlobe, GlobeCanvas, GlobeGraticule,
│   │   │           globeConfig, geoMath)
│   │   └── assistant/                ← NUEVO (módulo completo)
│   │       ├── AssistantProvider.jsx
│   │       ├── index.js
│   │       ├── components/
│   │       │   ├── AssistantFab.jsx
│   │       │   ├── Thread.jsx
│   │       │   ├── MarkdownText.jsx
│   │       │   └── RobotMascot.jsx
│   │       ├── hooks/useRobotMood.js
│   │       ├── prompts/systemPrompt.js
│   │       ├── services/chatAdapter.js
│   │       └── styles/
│   │           ├── assistant-theme.css
│   │           ├── assistantScroll.css
│   │           └── robotMascot.css
├── .env.example                      ← NUEVO
└── index.html · vite.config.js · eslint.config.js · package.json
    · README.md · doc.md · plan.md · integration.md
```

### 2.3 Estado por módulo

| Módulo (plan.md) | Original | V2 | Acción al integrar |
|---|---|---|---|
| M1 Globo 3D | Completo | Parcial | Conservar el del original |
| M2 Datos/servicios | Completo (o planificado) | Ausente | Conservar el del original |
| M3 Filtros/leyenda | Completo | Ausente | Conservar el del original |
| M4 Dashboard/alertas | Completo | Ausente | Conservar el del original |
| M5 Asistente IA | Solo `mapActions.js` | **Completo** | **Portar desde V2** |
| M6 Historial | Store | Ausente | No se toca |
| Stores | 6 | 0 | Conservar; adaptar `useAssistantStore` |
| UI kit | Completo | 0 | Conservar el del original |
| Servidor IA | No existía | Nuevo | **Portar desde V2** |

---

## 3. Qué se ha implementado exactamente en V2

### 3.1 Archivos nuevos del asistente (copiar tal cual)

| Archivo | Responsabilidad | Dependencias clave |
|---|---|---|
| `src/features/assistant/index.js` | API pública del módulo | — |
| `src/features/assistant/AssistantProvider.jsx` | Envuelve la app con `AssistantRuntimeProvider` + `useLocalRuntime(chatAdapter)` | `@assistant-ui/react` |
| `src/features/assistant/components/AssistantFab.jsx` | Robot flotante + panel modal (no se cierra al hacer clic afuera) | `@assistant-ui/react`, `RobotMascot`, `Thread` |
| `src/features/assistant/components/Thread.jsx` | Lista de mensajes, sugerencias y composer | `@assistant-ui/react` |
| `src/features/assistant/components/MarkdownText.jsx` | Markdown (GFM) con estilos del asistente | `@assistant-ui/react-markdown`, `remark-gfm` |
| `src/features/assistant/components/RobotMascot.jsx` | Mascota SVG animada con 6 estados | `react`, `robotMascot.css` |
| `src/features/assistant/hooks/useRobotMood.js` | Traduce el estado del chat a estado de ánimo | `@assistant-ui/react` |
| `src/features/assistant/prompts/systemPrompt.js` | Prompt de sistema (compartido con el server) | — |
| `src/features/assistant/services/chatAdapter.js` | Adaptador de streaming `POST /api/chat` | `fetch` |
| `src/features/assistant/styles/assistant-theme.css` | Tokens `bot-*` (paleta aislada) | Tailwind v4 `@theme` |
| `src/features/assistant/styles/assistantScroll.css` | Scrollbar del chat | CSS |
| `src/features/assistant/styles/robotMascot.css` | Animaciones de la mascota | CSS |
| `server/index.js` | Express + AI SDK + proveedores + modo demo | `express`, `dotenv`, `ai`, `@ai-sdk/*` |

### 3.2 Archivos compartidos modificados (aplicar parches, no reemplazar)

| Archivo | Cambio | Cómo aplicarlo |
|---|---|---|
| `src/index.css` | Añade `@import "./features/assistant/styles/assistant-theme.css";` | Añadir la línea **después** de `theme.css` |
| `src/layouts/ExplorerLayout.jsx` | Envuelve en `<AssistantProvider>` y añade `<AssistantFab />` | Aplicar solo ese patch sobre el layout original |
| `package.json` | Scripts `dev`/`dev:web`/`dev:api` + 9 dependencias + `concurrently` | Fusionar, no reemplazar scripts existentes |
| `vite.config.js` | Proxy `/api → http://localhost:3001` | Fusionar dentro de `server` |
| `eslint.config.js` | Globals de Node para `server/**/*.js` | Añadir bloque al final |
| `README.md` | Instrucciones de ejecución | Añadir sección, conservar la existente |
| `.env.example` | Variables del asistente | Crear/copiar |

### 3.3 Línea de tiempo real (git)

```
3907c16 Primer commit                 ← base V2 (globo parcial)
       ├── M src/index.css             (+1 import)
       ├── M src/layouts/ExplorerLayout.jsx (provider + FAB)
       ├── M package.json / package-lock.json
       ├── M vite.config.js            (proxy /api)
       ├── M eslint.config.js          (globals node)
       ├── M README.md
       ├── ?? .env.example
       ├── ?? server/
       └── ?? src/features/assistant/  ← módulo completo
```

---

## 4. Qué NO se debe perder (guardrails)

Estas reglas son obligatorias para la IA integradora:

1. **No reemplazar** `src/styles/theme.css` por el de V2. El original usa tokens
   `space-*`, `hud-*`, `sensor-*` y variantes `terra/aqua/classic`; V2 usa `void/panel`.
   Son sistemas distintos. Solo se **añade** `assistant-theme.css`.
2. **No sobrescribir** `src/layouts/ExplorerLayout.jsx`. Se aplica el patch mínimo de provider/FAB
   conservando sidebar, paneles y estructura responsive del original.
3. **No borrar** `src/stores/useAssistantStore.js` ni `src/features/assistant/constants/mapActions.js`.
   El asistente nuevo no los usa, pero el resto del original puede hacerlo. Se adaptan, no se eliminan.
4. **No borrar** `src/stores/*`, `src/services/*`, `src/constants/*`, `src/components/*` ni las features
   (`map2d`, `explorer`, `analysis`, `filters`, `probe`). Son el valor del proyecto original.
5. **No cambiar** versiones existentes de React, Vite, Tailwind, Router o Three.js para “igualar” a V2.
   Solo instalar las dependencias nuevas del asistente.
6. **No exponer** ninguna API key en el cliente. La key vive solo en `.env` (servidor).
7. **No ejecutar** `npm run dev` si se trabaja con el flujo del `CLAUDE.md` del proyecto; el dueño lo
   ejecuta en otra terminal. Verificar con `lint` y `build`.

---

## 5. Plan de integración paso a paso

> Destino: repositorio del **proyecto original completo**.
> Origen: carpeta `TerraTermV2` (esta rama).
> Trabajar en una rama nueva: `feat/asistente-ia`.

### Fase 0 — Preparación y red de seguridad

1. Crear rama: `git checkout -b feat/asistente-ia`.
2. Confirmar que el estado actual compila: `npm run lint` y `npm run build`.
3. Guardar una referencia del layout y del CSS compartido antes de tocarlos.
4. Comprobar la versión de Node (recomendado **Node 20+** por `ai@7`, `express@5`).

### Fase 1 — Copiar el módulo (solo archivos nuevos)

Copiar desde V2 al destino, respetando rutas:

```
src/features/assistant/                →  src/features/assistant/
  ├── AssistantProvider.jsx
  ├── index.js
  ├── components/{AssistantFab,Thread,MarkdownText,RobotMascot}.jsx
  ├── hooks/useRobotMood.js
  ├── prompts/systemPrompt.js
  ├── services/chatAdapter.js
  └── styles/{assistant-theme,assistantScroll,robotMascot}.css

server/index.js                        →  server/index.js
.env.example                           →  .env.example  (si no existe, o fusionar)
```

**Importante:** el original ya tiene `src/features/assistant/constants/mapActions.js`.
La copia debe **convivir** con él; no lo borre. El nuevo `index.js` no lo exporta, no hay conflicto.

### Fase 2 — Dependencias y scripts

Instalar solo lo nuevo (si el original ya tiene alguna, conservar su versión):

```bash
npm install @assistant-ui/react@^0.15.36 @assistant-ui/react-markdown@^0.14.26 \
  ai@^7.0.173 @ai-sdk/google@^4.0.121 @ai-sdk/groq@^4.0.84 @ai-sdk/openai@^4.0.118 \
  express@^5.3.0 dotenv@^18.0.10 remark-gfm@^4.0.1

npm install -D concurrently@^10.0.7
```

Fusionar en `package.json` **sin perder** los scripts existentes:

```json
{
  "scripts": {
    "dev": "concurrently -n web,api -c cyan,yellow \"vite\" \"node --watch server/index.js\"",
    "dev:web": "vite",
    "dev:api": "node --watch server/index.js"
  }
}
```

> Si el script `dev` original hacía otra cosa, conservar su comportamiento y añadir
> `dev:api` + una variante conjunta (por ejemplo `dev:all`).

### Fase 3 — Configuración

1. `vite.config.js`: añadir el proxy dentro de `server` (fusionar con lo que exista):

```js
server: { proxy: { "/api": "http://localhost:3001" } }
```

2. `eslint.config.js`: añadir al final:

```js
{
  files: ['server/**/*.js'],
  languageOptions: { globals: globals.node },
}
```

3. `.env`: copiar `.env.example` y configurar:

```env
AI_PROVIDER=google
AI_MODEL=gemini-3.5-flash-lite
GOOGLE_GENERATIVE_AI_API_KEY=...
# GROQ_API_KEY=
# OPENAI_API_KEY=
PORT=3001
# AI_TIMEOUT_MS=30000
```

4. Verificar que `.gitignore` del original incluya `.env` y `.env.*` (excepto `.env.example`).

### Fase 4 — Cablear el layout

En el `src/layouts/ExplorerLayout.jsx` del original, aplicar **solo** este cambio:

```jsx
import { AssistantFab, AssistantProvider } from '@/features/assistant'

function ExplorerLayout() {
  return (
    <AssistantProvider>
      {/* ... TODO el layout original se conserva ... */}
      <AssistantFab />   {/* colocar dentro del provider, al final */}
    </AssistantProvider>
  )
}
```

Consideraciones:

- El `AssistantProvider` debe quedar **por encima** de cualquier componente que use el chat.
- Si el original ya tiene otros providers, colocar `AssistantProvider` dentro o fuera de ellos sin
  duplicar el árbol; no anidar dos veces.
- El robot se posiciona con `position="right-6 bottom-6"` por defecto. Si el dashboard/filtros del
  original ocupan esa esquina, usar `position="left-6 bottom-6"` o ajustar la prop.
- El panel usa `z-50`; revisar que no quede debajo de modales existentes.

### Fase 5 — Estilos y compatibilidad de tokens

1. En `src/index.css` del original, añadir **después** de Tailwind y `theme.css`:

```css
@import "./features/assistant/styles/assistant-theme.css";
```

2. El asistente usa tokens `bot-*` propios → **no** choca con `space-*`, `sensor-*`, `terra` ni `aqua`.
3. `MarkdownText.jsx` usa la clase `font-display`. Si el `theme.css` original **no** define
   `--font-display`, hacer una de estas dos cosas:
   - añadir `--font-display: "Inter", system-ui, sans-serif;` en `@theme`, o
   - cambiar `font-display` por `font-sans` en `MarkdownText.jsx`.
4. No tocar las variantes `terra:`, `aqua:`, `classic:` ni los tokens de sensor.

### Fase 6 — Adaptar el asistente al estado del original (M5 real)

El asistente portado funciona en modo **conversación simple**. El plan original M5 pedía además
**contexto** y **acciones sobre el mapa**. Para completar M5 sin romper nada:

1. **Contexto** (recomendado, bajo riesgo)
   - Crear `src/features/assistant/utils/buildAssistantContext.js` que lea
     `useMapStore` (ubicación, capa, vista) y `useFiltersStore` (variable, periodo) y devuelva un
     objeto pequeño.
   - Enviarlo en el body de `chatAdapter` (`{ messages, context }`).
   - En `server/index.js`, aceptar `context` y anexarlo al `system` (concatenar texto), sin cambiar
     el contrato de streaming.

2. **Acciones sobre el mapa** (opcional, fase posterior)
   - El original ya define el contrato en `src/features/assistant/constants/mapActions.js`
     (`SET_LOCATION`, `SET_VARIABLE`, `SET_PERIOD`, `SET_LAYER`).
   - Camino robusto: usar *tool calling* del AI SDK en el servidor y emitir acciones estructuradas;
     el cliente las despacha con `dispatchMapActions.js` hacia los stores.
   - Camino mínimo: pedir al modelo un bloque JSON de acción al final y parsearlo en el cliente.
     No implementar esto antes de tener contexto, para no romper el streaming de texto.

3. **`useAssistantStore`**
   - El nuevo asistente usa el runtime de `assistant-ui`, no el store.
   - Opción A (recomendada): dejar el store para persistencia/historial y sincronizarlo desde el
     chat. Opción B: mantenerlo intacto aunque no se use. **No eliminarlo.**

4. **Servicios**
   - `chatAdapter` hace `fetch` directo. Si el original exige pasar por
     `src/services/api/httpClient.js`, se puede migrar después; para el primer port es aceptable
     porque ya es un servicio separado de la UI.

### Fase 7 — Verificación

Ejecutar (según las reglas del proyecto, el dueño puede correr el `dev`):

```bash
npm run lint
npm run build
```

Pruebas funcionales:

1. `http://localhost:3001/api/health` → `{ ok: true, mode: "ia" }` con key; `"demo"` sin key.
2. Abrir la app → aparece el robot abajo a la derecha.
3. Clic en el robot → panel de chat; clic fuera → **no se cierra**.
4. Enviar una sugerencia → respuesta en streaming, markdown correcto.
5. Sin key → respuesta del **modo demo** palabra por palabra.
6. Provocar error (key inválida / sin servidor) → mensaje claro en el chat y estado `error` del robot.
7. Regresión: globo, filtros, dashboard, alertas y layout responsive siguen funcionando.
8. Revisar que la key no aparezca en `dist/` (solo debe estar en `.env` del servidor).

### Fase 8 — Endurecimiento (opcional, post-integración)

- Igualar la paleta del robot/FAB con el acento del sensor activo (`text-sensor-accent`) en lugar de
  azul fijo.
- Persistencia de conversación (historial) usando el store.
- Rate limit básico en `/api/chat` (por IP) y límite de longitud de mensajes.
- Reverse proxy de `/api` en producción (el proxy de Vite es solo para desarrollo).
- Tests del adaptador y del parser de acciones.

---

## 6. Checklist de copia archivo por archivo

| Origen (V2) | Destino (original) | Acción | Notas |
|---|---|---|---|
| `src/features/assistant/index.js` | `src/features/assistant/index.js` | Copiar | No pisa `constants/` |
| `src/features/assistant/AssistantProvider.jsx` | idem | Copiar | — |
| `src/features/assistant/components/AssistantFab.jsx` | idem | Copiar | Ajustar `position` si choca |
| `src/features/assistant/components/Thread.jsx` | idem | Copiar | — |
| `src/features/assistant/components/MarkdownText.jsx` | idem | Copiar | Verificar `font-display` |
| `src/features/assistant/components/RobotMascot.jsx` | idem | Copiar | — |
| `src/features/assistant/hooks/useRobotMood.js` | idem | Copiar | — |
| `src/features/assistant/prompts/systemPrompt.js` | idem | Copiar | — |
| `src/features/assistant/services/chatAdapter.js` | idem | Copiar | — |
| `src/features/assistant/styles/assistant-theme.css` | idem | Copiar | — |
| `src/features/assistant/styles/assistantScroll.css` | idem | Copiar | — |
| `src/features/assistant/styles/robotMascot.css` | idem | Copiar | — |
| `server/index.js` | `server/index.js` | Copiar | Ruta del prompt relativa a `src/` |
| `.env.example` | `.env.example` | Copiar/fusionar | No sobrescribir variables existentes |
| `src/index.css` | `src/index.css` | **Parche** | +1 import |
| `src/layouts/ExplorerLayout.jsx` | idem | **Parche** | Provider + FAB |
| `package.json` | idem | **Parche** | Deps + scripts |
| `vite.config.js` | idem | **Parche** | Proxy `/api` |
| `eslint.config.js` | idem | **Parche** | Globals Node |
| `README.md` | idem | **Parche** | Sección de ejecución |

**No copiar** (son de V2 y no deben pisar al original):

- `src/styles/theme.css`
- `src/App.jsx`, `src/main.jsx`, `src/router/*`, `src/pages/*`
- `src/features/globe/*` (el original ya tiene una versión más completa)
- `package-lock.json` (se regenera al instalar)
- `integration.md`

---

## 7. Contrato del asistente (para mantener compatibilidad)

### Endpoints

```
GET  /api/health
  → 200 { ok: true, mode: "ia"|"demo", provider, model }

POST /api/chat
  body: { messages: [{ role: "user"|"assistant", content: "texto" }] }
  → 200 text/plain en streaming (texto incremental)
  → 400 { error: "Faltan mensajes" }
  → 502 { error: "mensaje claro" }
```

### Variables de entorno

| Variable | Uso | Default |
|---|---|---|
| `AI_PROVIDER` | `google` \| `groq` \| `openai` | `google` |
| `AI_MODEL` | id del modelo | según proveedor |
| `GOOGLE_GENERATIVE_AI_API_KEY` | key Gemini | — |
| `GROQ_API_KEY` | key Groq | — |
| `OPENAI_API_KEY` | key OpenAI | — |
| `PORT` | puerto del server | `3001` |
| `AI_TIMEOUT_MS` | timeout del modelo | `30000` |

### Comportamiento sin key

`DEMO_MODE`: el servidor responde simulando streaming palabra por palabra. Sirve para probar la UI
sin credenciales. No llama a ningún modelo.

---

## 8. Diferencias que exigen adaptación (resumen)

| Diferencia | Riesgo | Solución |
|---|---|---|
| Tokens de tema distintos (`space-*` vs `void`) | Medio | No tocar `theme.css`; solo importar `assistant-theme.css` |
| `font-display` usado por Markdown | Bajo | Añadir token o cambiar a `font-sans` |
| El original ya tiene `assistant/constants/mapActions.js` | Bajo | Convivir; no borrar |
| `useAssistantStore` no se usa en V2 | Medio | Conservar y sincronizar o dejar intacto |
| Contexto (ubicación/variable/periodo) no se envía | Alto (funcional) | Implementar `buildAssistantContext` (Fase 6) |
| Acciones sobre el mapa no implementadas | Alto (funcional M5) | Tool calling o parser JSON (Fase 6, opcional) |
| Proxy `/api` solo en dev | Medio (producción) | Reverse proxy en despliegue |
| Layout original puede ocupar la esquina derecha | Bajo | Prop `position` del FAB |
| El prompt dice “no inventes cifras” pero no hay datos inyectados | Medio | Inyectar contexto/datos antes de prometer cifras |
| Node antiguo | Medio | Requerir Node 20+ |

---

## 9. Criterios de aceptación

- [ ] El proyecto original **conserva** todos sus módulos y features.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` genera `dist/` correctamente.
- [ ] El robot aparece y abre/cierra el chat.
- [ ] El chat responde en streaming con markdown.
- [ ] El modo demo funciona sin key.
- [ ] Los errores del proveedor se muestran de forma clara.
- [ ] Ninguna key está en el bundle del cliente.
- [ ] Globo, filtros, dashboard, alertas y responsive siguen funcionando.
- [ ] `doc.md` y `README.md` actualizados con el módulo y su ejecución.

---

## 10. Rollback

La integración es aditiva, así que revertir es sencillo:

1. Descartar parches:
   ```bash
   git checkout -- src/index.css src/layouts/ExplorerLayout.jsx \
     package.json package-lock.json vite.config.js eslint.config.js README.md
   ```
2. Eliminar archivos nuevos:
   ```bash
   rm -rf src/features/assistant/components src/features/assistant/hooks \
     src/features/assistant/prompts src/features/assistant/services \
     src/features/assistant/styles server
   ```
   (Conservar `src/features/assistant/constants/` y el `index.js` original si existían.)
3. O simplemente no fusionar la rama `feat/asistente-ia`.

---

## 11. Anexo — Prompt del sistema (referencia)

El prompt vive en `src/features/assistant/prompts/systemPrompt.js` y lo importa el servidor
(`../src/features/assistant/prompts/systemPrompt.js`). Si en el proyecto original se mueve de sitio,
**actualizar la ruta del import en `server/index.js`**.

Resumen del prompt actual:

- Español claro y breve para agricultores, pescadores y estudiantes.
- Explicar qué cambia, dónde, cuánto y si es estadísticamente significativo.
- No inventar cifras; si falta el dato, decirlo y sugerir cómo consultarlo.
- Citar fuente y periodo.
- Redirigir preguntas fuera del dominio ambiental.
- Markdown simple; sin LaTeX ni signos `$`; unidades en texto normal.

---

## 12. Anexo — Si el objetivo fuera el inverso

Si en lugar de portar el asistente al original se quisiera **reconstruir el original dentro de V2**,
NO se debe intentar a mano: V2 carece de stores, services, constants, UI kit y features completas.
La vía correcta sería recuperar esos archivos desde el repositorio original y luego aplicar el mismo
port del asistente. El asistente es compatible con ambos escenarios porque:

- usa tokens `bot-*` aislados,
- es una feature autocontenida,
- y solo toca el layout mediante un provider y un componente flotante.

---

## 13. Resumen de una frase

**Copiar los 13 archivos del asistente + `server/` al proyecto original, aplicar 6 parches pequeños,
no sobrescribir nada existente y completar el contexto/acciones en una segunda fase.**
