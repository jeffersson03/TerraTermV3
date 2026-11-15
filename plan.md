# TerraTerm — Plan de desarrollo

> Plan para que el equipo trabaje en paralelo por módulos, reutilice el sistema de diseño y pueda unir las partes sin conflictos.
> Complementa a [`doc.md`](doc.md) (qué hace cada archivo hoy). Fecha de inicio: 2026-11-14.

---

## 0. Idea central

Para trabajar en paralelo sin romper nada, **primero se acuerdan los contratos** (forma del estado, formato de datos, componentes UI base) y **después** cada persona desarrolla su módulo detrás de esos contratos.

```
            ┌──────────────────────── Contratos compartidos (Fase 0) ────────────────────────┐
            │  stores · catálogo de variables · formato de respuesta · UI kit · acciones IA  │
            └────────────────────────────────────────────────────────────────────────────────┘
                 ▲            ▲             ▲              ▲              ▲
   ┌─────────────┴──┐ ┌───────┴──────┐ ┌────┴──────┐ ┌─────┴──────┐ ┌─────┴───────┐
   │ M1 Globo 3D    │ │ M2 Datos     │ │ M3 Filtros│ │ M4 Dashboard│ │ M5 Asistente│
   │  y capas       │ │  y servicios │ │  y leyenda│ │  y alertas  │ │  IA         │
   └────────────────┘ └──────────────┘ └───────────┘ └─────────────┘ └─────────────┘
                 │            │             │              │              │
                 └────────────┴──── Integración en ExplorerPage (Fase 3) ─┴──────────────┘
```

Regla de oro: **ningún módulo importa componentes internos de otro módulo.** Se comunican solo mediante:
1. los **stores** compartidos (`src/stores/`),
2. los **hooks públicos** que exporta cada feature (`src/features/<x>/index.js`),
3. los **componentes del UI kit** (`src/components/`).

---

## 1. Fases

| Fase | Objetivo | Resultado | Quién |
|---|---|---|---|
| **0. Contratos** | Definir estado, datos y UI base | Stores, catálogo, cliente HTTP, UI kit mínimo | Todo el equipo (1 sesión) |
| **1. Módulos aislados** | Cada módulo funciona con datos simulados (*mocks*) | Features que se renderizan solas | Cada responsable |
| **2. Datos reales** | Sustituir mocks por servicios NASA | Servicios con caché y manejo de errores | M2 + quien consuma |
| **3. Integración** | Componer todo en `ExplorerPage` + layout responsive | Explorador completo | Integrador + todos |
| **4. Pulido** | Accesibilidad, responsive, estados vacíos/error, demo | Versión de presentación | Todos |

**MVP (alcance mínimo para la demo):** una variable — **Temperatura superficial (LST)** —, selección de ubicación en el globo, periodo, gráfico de serie temporal, una alerta por umbral y el asistente respondiendo con fuentes. Las demás variables (humedad del suelo, precipitación, NDVI, nieve) se añaden luego **solo agregando entradas al catálogo**.

---

## 2. Fase 0 — Contratos compartidos

Esta fase se hace **antes de repartir el trabajo**. Son archivos pequeños, pero todos dependen de ellos.

### 2.1 Estado compartido — `src/stores/`

Librería recomendada: **zustand** (stores pequeños, sin providers).

```bash
npm install zustand
```

| Store | Estado | Acciones | Lo escriben | Lo leen |
|---|---|---|---|---|
| `useTelemetryStore` | `domain ('classic' \| 'terra' \| 'aqua')` | `setDomain` · `cycleDomain` | M1, M3, M5 | Todos |
| `useMapStore` | `selectedLocation {lat, lon, label}` · `cameraTarget` | `setLocation(loc, {fly})` · `flyTo` · `clearLocation` | M1, M3, M5 | Todos |
| `useHoverStore` | `hoveredLocation` · `hoveredFeature` (cambia ~30/s) | `setHoveredLocation` · `setHoveredFeature` · `clearHover` | M1 | Solo componentes pequeños |
| `useFiltersStore` | `variableId` · `period {start, end}` · `compareLocations []` (máx. 3) | `setVariable` · `setPeriod` · `addCompare` · `removeCompare` | M3, M5 | M1, M2, M4 |
| `useAssistantStore` | `messages []` · `status ('idle' \| 'thinking' \| 'error')` · `error` | `addMessage` · `setThinking` · `setIdle` · `setError` · `clear` | M5 | M5 |
| `useAlertsStore` | `alerts []` · `dismissedIds []` | `setAlerts` · `dismiss` · `clear` · hook `useVisibleAlerts()` | M4 | M1, M4 |

> Los stores solo guardan estado: las llamadas a servicios y la evaluación de reglas viven en servicios/utils de cada módulo.
> Selectores que devuelven arrays u objetos nuevos (p. ej. un `filter`) deben envolverse en `useShallow`, o zustand v5 entra en un bucle de renders.

> Un store = una responsabilidad. Si un módulo necesita un estado nuevo, se propone en el canal del equipo antes de añadirlo.

### 2.2 Catálogo de variables — `src/constants/variables.js`

Cada variable es **configuración**, no código. Agregar una variable no debe obligar a tocar componentes.

```js
// Forma acordada de cada variable
{
  id: 'lst',
  label: 'Temperatura superficial',
  unit: '°C',
  domain: 'land',              // 'land' | 'ocean' | 'both'
  source: 'NASA MODIS (Terra/Aqua)',
  resolution: '1 km · diaria',
  range: [-40, 45],
  palette: ['#1E3A8A', '#0284C7', '#38BDF8', '#2DD4BF', '#FACC15', '#FB923C', '#EF4444', '#991B1B'],
  layerProvider: 'gibs',       // de dónde sale la textura del globo
  seriesProvider: 'power',     // de dónde sale la serie temporal
  activities: ['agricultura'], // relación con actividades productivas
}
```

### 2.3 Formato de datos — `src/services/`

**Todos** los servicios devuelven la misma forma. Así el dashboard, los gráficos y el asistente no dependen de qué API respondió.

```js
{
  data: [...],                 // serie o valores
  meta: {
    variableId: 'lst',
    source: 'NASA POWER',
    unit: '°C',
    period: { start: '2025-01-01', end: '2025-12-31' },
    resolution: 'diaria · 0.5°',
    kind: 'observation',       // 'observation' | 'estimate' | 'prediction'
    fetchedAt: '2026-11-14T10:00:00Z',
  },
}
```

Y los hooks que los consumen exponen siempre: `{ data, meta, isLoading, error, isEmpty, isStale }`.

| Archivo | Responsabilidad |
|---|---|
| `services/api/httpClient.js` | `fetch` con timeout, reintento, errores normalizados y caché en memoria |
| `services/nasa/gibsService.js` | URLs de texturas/tiles por variable y fecha |
| `services/nasa/powerService.js` | Series temporales por punto (lat/lon + periodo) |
| `services/geospatial/geocodingService.js` | Buscar lugar por nombre ↔ coordenadas |
| `services/mocks/` | Datos simulados con la **misma forma** (para Fase 1) |

### 2.4 UI kit base — `src/components/`

Componentes genéricos que **todos** reutilizan. Ningún módulo crea su propia versión de un panel, botón o loader.

| Componente | Props principales | Uso |
|---|---|---|
| `HudPanel` | `title`, `actions`, `children`, `corners` | Contenedor estándar con marcas de mira en esquinas |
| `HudButton` | `variant ('primary' \| 'ghost')`, `accent`, `icon` | Botones |
| `HudSelect` / `HudToggle` | `options`, `value`, `onChange`, `label` | Controles de formulario |
| `StatTile` | `label`, `value`, `unit`, `delta`, `kind` | Indicador numérico (`tabular-nums`) |
| `ColorLegend` | `palette`, `range`, `unit` | Leyenda de color de una capa |
| `SourceBadge` | `meta` | Fuente · fecha · resolución · tipo (observación/estimación/IA) |
| `DataState` | `isLoading`, `error`, `isEmpty`, `isStale`, `children` | Envuelve cualquier bloque de datos y muestra loader / error / vacío / desactualizado |
| `Sheet` | `open`, `side`, `children` | Panel lateral en escritorio, hoja inferior en móvil |

> Todos usan solo los tokens de `src/styles/theme.css` (`bg-panel`, `border-grid`, `text-ink`, `text-terra`, …). Si hace falta un color nuevo, se agrega como token, no como hex en el JSX.

### 2.5 Acciones del asistente sobre el mapa — `src/features/assistant/constants/mapActions.js`

El asistente **no toca componentes**: devuelve acciones que un *dispatcher* traduce a llamadas de los stores.

```js
{ type: 'SET_LOCATION', payload: { lat, lon, label } }
{ type: 'SET_VARIABLE', payload: { variableId } }
{ type: 'SET_PERIOD',   payload: { start, end } }
{ type: 'SET_LAYER',    payload: { layerId } }
```

---

## 3. Módulos y responsables

Cada módulo vive en `src/features/<modulo>/` con esta estructura y un `index.js` que define **lo que es público**:

```
features/<modulo>/
├─ components/     # componentes internos del módulo
├─ hooks/          # hooks del módulo
├─ constants/
├─ utils/
└─ index.js        # export { ComponentePrincipal, useHookPublico }
```

### M1 — Globo 3D y capas (`features/globe/`) · *ya iniciado*

| Tarea | Archivo | Depende de |
|---|---|---|
| Textura real de la Tierra (base oscura / hillshade) | `components/EarthTexture.jsx` | — |
| Capa de datos con textura GIBS + opacidad 65 % | `components/layers/DataLayer.jsx` | M2 `gibsService`, catálogo |
| Seleccionar punto al hacer clic → `setLocation` | `hooks/useGlobePicking.js` | `useMapStore` |
| Marcador de ubicación seleccionada (pulso) | `components/LocationMarker.jsx` | `useMapStore` |
| Volar la cámara a una ubicación | `hooks/useCameraFlyTo.js` | `useMapStore.cameraTarget` |
| Marcadores de alertas | `components/AlertMarkers.jsx` | `useAlertsStore` |
| Máscara Terra/Aqua (tierra u océano oscuro) | `components/ViewModeMask.jsx` | `useMapStore.viewMode` |
| Crosshair con lat/lon en bordes | `components/GlobeCrosshair.jsx` | — |

**Público:** `GlobeCanvas`.

### M2 — Datos y servicios (`services/`, `hooks/`, `constants/`)

| Tarea | Archivo |
|---|---|
| Cliente HTTP común | `services/api/httpClient.js` |
| Catálogo de variables (empezar con LST y SST) | `constants/variables.js` |
| Servicio GIBS (texturas por fecha) | `services/nasa/gibsService.js` |
| Servicio POWER (series por punto) | `services/nasa/powerService.js` |
| Geocodificación | `services/geospatial/geocodingService.js` |
| Mocks con la forma acordada | `services/mocks/*.js` |
| Hook genérico de datos | `hooks/useEnvironmentalData.js` |
| Configuración de entorno y endpoints | `config/env.js`, `config/endpoints.js` |

**Público:** `useEnvironmentalData(variableId, location, period)`, `VARIABLES`, `getVariable(id)`.

### M3 — Filtros y leyenda (`features/filters/`)

| Tarea | Archivo | Depende de |
|---|---|---|
| Buscador de ubicación | `components/LocationSearch.jsx` | `geocodingService`, `useMapStore` |
| Selector de variable (lee el catálogo) | `components/VariablePicker.jsx` | `VARIABLES`, `useFiltersStore` |
| Selector de periodo / línea de tiempo | `components/PeriodPicker.jsx` | `useFiltersStore` |
| Toggle Terra ↔ Aqua | `components/ViewModeToggle.jsx` | `useMapStore` |
| Leyenda de la capa activa | usa `ColorLegend` del UI kit | catálogo |
| Panel contenedor | `components/FiltersPanel.jsx` | `HudPanel`, `Sheet` |

**Público:** `FiltersPanel`.

### M4 — Dashboard y alertas (`features/dashboard/`, `features/alerts/`)

| Tarea | Archivo | Depende de |
|---|---|---|
| Indicadores (actual, media, mín/máx, Δ) | `dashboard/components/IndicatorsRow.jsx` | `StatTile`, `useEnvironmentalData` |
| Gráfico de serie temporal | `dashboard/components/TimeSeriesChart.jsx` | librería de gráficos* |
| Comparación entre ubicaciones/periodos | `dashboard/components/ComparisonChart.jsx` | `useFiltersStore.compareLocations` |
| Cálculo de tendencia y variación | `dashboard/utils/trendAnalysis.js` | — (funciones puras) |
| Reglas de umbral | `alerts/constants/alertRules.js` | catálogo |
| Evaluación de alertas | `alerts/utils/evaluateAlerts.js` | `useAlertsStore` |
| Lista de alertas | `alerts/components/AlertsList.jsx` | `HudPanel` |

\* Propuesta: `npm install recharts` (decidir en Fase 0).

**Público:** `DashboardPanel`, `AlertsPanel`.

### M5 — Asistente IA (`features/assistant/`)

| Tarea | Archivo | Depende de |
|---|---|---|
| Interfaz de chat | `components/AssistantChat.jsx` | `useAssistantStore`, `HudPanel` |
| Mensaje con fuentes y tipo (IA/observación) | `components/AssistantMessage.jsx` | `SourceBadge` |
| Servicio que llama al **backend/proxy** | `services/assistantService.js` | `httpClient` |
| Traducir acciones IA → stores | `utils/dispatchMapActions.js` | `mapActions`, stores |
| Contexto que se envía (ubicación, variable, periodo, datos) | `utils/buildAssistantContext.js` | stores |

> La clave de la API de IA **nunca** va en el frontend. M5 necesita un backend mínimo (función serverless o servidor pequeño) que reciba la pregunta y el contexto y llame al modelo. Definir en Fase 0 quién lo monta.

**Público:** `AssistantPanel`.

### Integrador — Layout y página (`layouts/`, `pages/`)

| Tarea | Archivo |
|---|---|
| Distribución escritorio: filtros izquierda · globo centro · dashboard derecha · asistente flotante | `layouts/ExplorerLayout.jsx` |
| Tablet: paneles colapsables | `layouts/ExplorerLayout.jsx` |
| Móvil: globo a pantalla completa + hojas inferiores (`Sheet`) con pestañas | `layouts/ExplorerLayout.jsx` |
| Componer los módulos públicos | `pages/ExplorerPage.jsx` |

---

## 4. Mapa de dependencias

```
UI kit ─────────────┬──────────┬──────────┬──────────┐
                    ▼          ▼          ▼          ▼
Stores ───────► M1 Globo   M3 Filtros  M4 Dash   M5 Asistente
                    ▲          ▲          ▲          ▲
M2 Datos ───────────┴──────────┴──────────┴──────────┘
```

- **Bloqueantes de todos:** stores, catálogo, formato de datos, UI kit mínimo (`HudPanel`, `DataState`).
- **M1, M3, M4 y M5 pueden empezar con mocks** desde el primer día de la Fase 1.
- **M2 no bloquea a nadie** si los mocks respetan el formato acordado.

---

## 5. Orden de integración (Fase 3)

Unir en este orden; probar cada paso antes del siguiente:

1. **Stores + catálogo + UI kit** en la base del proyecto.
2. **M3 Filtros + M1 Globo:** cambiar variable/ubicación actualiza el globo.
3. **M2 Datos reales** en lugar de mocks (el globo y los filtros no cambian).
4. **M4 Dashboard:** reacciona a ubicación/variable/periodo.
5. **M4 Alertas:** aparecen en la lista y como marcadores en el globo.
6. **M5 Asistente:** responde y mueve el mapa mediante acciones.
7. **Layout responsive** final y revisión en móvil/tablet.

---

## 6. Forma de trabajo

### Control de versiones
El proyecto **aún no es un repositorio git**. Recomendado:

```bash
git init
```

- Rama principal `main` siempre funcional.
- Una rama por módulo/tarea: `feat/globe-picking`, `feat/filters-period`, `fix/legend-units`.
- Pull request pequeño, revisado por otra persona antes de unir.

### Reglas para no pisarse
- Cada persona trabaja **dentro de su carpeta de feature**.
- Cambios en archivos compartidos (`stores/`, `components/`, `constants/variables.js`, `theme.css`, `appRouter.jsx`) se avisan al equipo y van en un PR propio.
- Si necesitas un componente UI que no existe, créalo en `src/components/` (genérico) y no dentro de tu feature.
- No duplicar: antes de crear algo, revisar `doc.md` y el UI kit.

### Definición de "terminado"
Una tarea está terminada cuando:
- [ ] Usa los tokens del tema y componentes del UI kit.
- [ ] Gestiona carga, error, vacío y datos desactualizados (`DataState`).
- [ ] Muestra fuente, unidad, periodo y resolución cuando presenta datos (`SourceBadge`).
- [ ] Se ve bien en escritorio, tablet y móvil.
- [ ] Es accesible: etiquetas, contraste y navegación con teclado.
- [ ] Funciones en camelCase, componentes en PascalCase; funciones largas divididas.
- [ ] `npm run lint` sin errores.
- [ ] `doc.md` actualizado con los archivos nuevos.

---

## 7. Checklist por fase

**Fase 0 — Contratos**
- [x] Instalar `zustand`
- [ ] Decidir librería de gráficos (propuesta: `recharts`)
- [x] `src/stores/`: `useMapStore`, `useFiltersStore`, `useAssistantStore`, `useAlertsStore` (+ `useTelemetryStore` para la vista y `useHoverStore` para el puntero, ya existentes)
- [x] `src/constants/variables.js` con LST y SST
- [x] `src/services/api/httpClient.js`, `serviceResponse.js`, `environmentalDataService.js` + mocks + hook `useEnvironmentalData`
- [x] UI kit mínimo: `HudPanel`, `HudButton`, `StatTile`, `ColorLegend`, `SourceBadge`, `DataState` (+ `StatusBadge`, `CoordinatePill`)
- [x] Contrato de acciones del asistente (`features/assistant/constants/mapActions.js`)
- [ ] Decidir y preparar el backend/proxy para la IA
- [ ] Repartir módulos M1–M5 e integrador

**Fase 1 — Módulos con mocks**
- [ ] M1 selección de ubicación, marcador y vuelo de cámara
- [ ] M3 panel de filtros conectado a stores
- [ ] M4 indicadores y gráfico de serie con mocks
- [ ] M5 chat funcionando contra un mock de respuesta

**Fase 2 — Datos reales**
- [ ] GIBS para textura de LST en el globo
- [ ] POWER para series temporales por punto
- [ ] Geocodificación en el buscador

**Fase 3 — Integración**
- [ ] Pasos 1–7 de la sección 5

**Fase 4 — Pulido y demo**
- [ ] Revisión responsive y accesibilidad
- [ ] Estados de error/vacío revisados en cada panel
- [ ] Guion de demo: agricultor (LST + suelo) y pescador (SST)
