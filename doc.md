# TerraTerm — Documentación de componentes

> Estado actual del frontend para que cualquier colaborador sepa **qué hace cada archivo**, **dónde agregar código nuevo** y **qué convenciones seguir**.
> Última actualización: 2026-11-14 · Versión UI: `v0.1`
> Plan de trabajo por módulos: ver [`plan.md`](plan.md).
> Datos NASA a investigar (dipolo Perú): ver [`research.md`](research.md).

---

## 1. Stack

| Herramienta | Versión | Uso |
|---|---|---|
| React | 19 | Interfaz (JSX) con React Compiler activo |
| Vite | 8 | Servidor de desarrollo y build |
| Tailwind CSS | 4 | Estilos y responsive (configuración vía `@theme` en CSS, sin `tailwind.config.js`) |
| React Router | 8 | Rutas (`react-router` y `react-router/dom`) |
| Three.js | 0.187 | Motor 3D |
| @react-three/fiber | 9 | Three.js declarativo con componentes React |
| @react-three/drei | 10 | Utilidades 3D (`OrbitControls`, `Stars`, …) |

**Alias:** `@/` apunta a `src/` (definido en `vite.config.js` y `jsconfig.json`).
Usar siempre `@/...` en lugar de rutas relativas largas (`../../..`).

---

## 2. Flujo actual

```
index.html
 └─ src/main.jsx            → monta React y carga los estilos globales
     └─ src/App.jsx         → RouterProvider
         └─ appRouter       → ruta "/"
             └─ ExplorerLayout     (barra fija con el logo + área de trabajo + robot del asistente)
                 └─ ExplorerPage   (página del explorador)
                     └─ GlobeCanvas      (escena 3D)
                         └─ EarthGlobe   (planeta)
                             └─ GlobeGraticule (retícula lat/lon)
                     └─ DockToggle + SideDock (hamburguesa → panel lateral, un módulo a la vez)
                         ├─ Zona        → FlowPanel (solo en el mapa 2D)
                         ├─ Tendencias  → AnalysisPanel → TrendExplorer (lazy: NASA POWER / IMERG)
                         └─ Asistente   → AssistantChat
```

El usuario entra **directo al explorador** (no hay landing page).

---

## 3. Archivos y responsabilidades

### Entrada

| Archivo | Responsabilidad |
|---|---|
| `index.html` | HTML base (`lang="es"`), carga de fuentes Google (Inter, JetBrains Mono) y punto de montaje `#root`. |
| `src/main.jsx` | Crea la raíz de React, importa `index.css` y renderiza `<App />` en `StrictMode`. |
| `src/App.jsx` | Solo monta el `RouterProvider`. No debe contener lógica de negocio ni UI. |

### Router — `src/router/`

| Archivo | Responsabilidad |
|---|---|
| `routePaths.js` | Constante `ROUTE_PATHS` con todas las URLs. **Nunca escribir rutas a mano** en componentes; importar desde aquí. |
| `appRouter.jsx` | Define el árbol de rutas con `createBrowserRouter`. Hoy: `/` → `ExplorerLayout` → `ExplorerPage` (index), con `RouteErrorPage` como `errorElement`. |

### Layouts — `src/layouts/`

| Archivo | Responsabilidad |
|---|---|
| `ExplorerLayout.jsx` | Marco a pantalla completa (`h-dvh`): barra superior HUD (logo + versión) y `<main>` donde se renderiza la página activa mediante `<Outlet />`. Aquí irán, más adelante, sidebar de filtros y paneles. |

### Páginas — `src/pages/`

| Archivo | Responsabilidad |
|---|---|
| `ExplorerPage.jsx` | Página principal. Por ahora solo contiene `GlobeCanvas`. Aquí se componen las features (filtros, dashboard, alertas, asistente). |
| `RouteErrorPage.jsx` | Pantalla de error: muestra "404" si la ruta no existe o un error genérico si algo falla al renderizar. Botón para volver al explorador. |

### Feature: Globo 3D — `src/features/globe/`

| Archivo | Responsabilidad |
|---|---|
| `components/GlobeCanvas.jsx` | Escena 3D: `<Canvas>` de Fiber, cámara, luces (ambiental + direccional), fondo de estrellas (`Stars`) y `OrbitControls` (zoom limitado, sin paneo; rotación automática configurable en `globeConfig`). Props `isActive` (deja de renderizar si está oculto) y `onCountryClick`. Los overlays HUD los monta `ExplorerPage`. |
| `components/SensorConsole.jsx` | **Solo en el globo.** Una pieza que une emblema animado, nombre de la vista, selector (`DomainSwitcher variant="embedded"`) y capa activa (`LayerInfo`). |
| `components/DomainEmblem.jsx` | SVG 64×64 animado: bisel de radar común + motivo por vista (Global: meridianos que giran · Terra: isotermas que laten · Aqua: olas + pulso de sonar). Respeta "reducir movimiento". |
| `components/LayerInfo.jsx` + `utils/describeLayer.js` | Leyenda(s), fuente y nota de la capa; compartido por `SensorConsole` (3D) y `LayerStatusPanel` (2D). |
| `components/CountryBorders.jsx` | Fronteras mundiales (1 draw call) y contorno del país en hover. Lee el país en hover de `useHoverStore` y el estilo de `getSensor(domain).borders`. |
| `components/DomainSwitcher.jsx` | Botones Classic / Terra / Aqua generados desde `SENSOR_ORDER`; cada botón lleva su propio `data-sensor`. |
| `hooks/useWorldTopology.js` | Descarga `/geo/countries-50m.topo.json` una sola vez (caché de módulo) y devuelve `countryFeatures`, `countryIndex` y `borderPositions` (recalculadas según el radio). |
| `hooks/useGlobeTextures.js` | Carga las 4 texturas del globo con respaldo de 1×1 px si fallan; las libera de la GPU al desmontar. |
| `hooks/useDomainShortcut.js` | Atajo [Espacio] para ciclar la vista; no actúa sobre botones, campos ni controles con rol. |
| `components/EarthGlobe.jsx` | El planeta: superficie con shader que mezcla Classic / Terra / Aqua (`shaderMix` del registro), fronteras, retícula y halo Fresnel. **Regla de color:** Terra y Aqua se dibujan sin iluminación, sin tone mapping y sin hillshade sobre la paleta, para que cada color en pantalla coincida con el hex de la leyenda (paleta definida en sRGB y convertida a lineal en el shader). Solo Classic usa la luz de la escena. |
| `components/GlobeGraticule.jsx` | Dibuja paralelos y meridianos como `lineSegments`. Props: `radius`, `stepDeg`, `color`. |
| `constants/globeConfig.js` | `GLOBE_CONFIG`: radio, segmentos, paso de retícula, colores, cámara y límites de zoom. **Cambiar valores aquí, no en los componentes.** |
| `utils/geoMath.js` | Funciones puras de geometría: `latLonToCartesian(lat, lon, radius)` → `[x, y, z]`; `cartesianToLatLon(point, radius)` → `{ lat, lon }`; `buildGraticulePositions`, `buildFeatureOutlinePositions`; `buildCountryIndex` + `findCountryAt` para detectar el país bajo el cursor. |

### Estilos — `src/styles/` y `src/index.css`

| Archivo | Responsabilidad |
|---|---|
| `src/index.css` | Importa Tailwind y el tema. |
| `src/styles/theme.css` | Tokens del sistema de diseño (skill **Design**): tokens fijos en `@theme`, tokens dinámicos por sensor (`data-sensor`) y variantes `terra:` / `aqua:`. Estilo base de `html`/`body`. |
| `src/constants/thermalPalette.js` | `THERMAL_PALETTE`: 5 colores sRGB de la escala térmica. **La misma lista** la usan el shader del globo (`uThermalStops`) y la futura leyenda, así nunca se desincronizan. |
| `src/constants/dataKinds.js` | `DATA_KINDS` / `getDataKind(id)`: tipos de información (observación, estimación, predicción, IA, imagen de referencia, prototipo visual) con etiqueta y color. Toda capa, indicador o respuesta debe declarar uno. |
| `src/stores/useHoverStore.js` | Estado del puntero sobre el globo o el mapa 2D: `hoveredLocation: { lat, lon, country, screenX, screenY }` (`country` = null sobre el océano) y `hoveredFeature` (país GeoJSON). Acciones: `setHoveredLocation`, `setHoveredFeature`, `clearHover`. Cambia hasta ~60 veces/s: **solo componentes pequeños deben suscribirse** (hoy `HoverProbe` y `CountryBorders`). No usar para la ubicación seleccionada. |
| `src/utils/formatCoordinates.js` | `formatLatitude` / `formatLongitude`: "14,07° S", "75,73° O" (formato es). |
| `src/components/Hud/CoordinatePill.jsx` | Pastilla presentacional de coordenadas + etiqueta opcional: `<CoordinatePill lat lon label />`. |
| `src/features/probe/components/HoverProbe.jsx` | **Sonda** que sigue al cursor en 3D y 2D: mira mínima + tarjeta con el lugar, la variable que colorea la vista en ese punto (swatch del color en la escala + valor, marcado "ilustr." mientras sea prototipo) y coordenadas. Se gira sola cerca de los bordes. |
| `src/features/probe/hooks/useProbeReading.js` | Decide tierra/mar con la máscara y lee el valor de la textura según `sensor.map2d` (Classic: LST en tierra y SST en mar · Terra: solo LST · Aqua: solo SST). |
| `src/services/textures/texturePixels.js` | Carga única de imágenes y píxeles de las texturas (`loadImage`, `loadTexturePixels`, `sampleChannelAt`); la usan la sonda y el ráster 2D. |
| `src/components/Hud/StatusBadge.jsx` | Etiqueta reutilizable del tipo de dato: `<StatusBadge kind="prototype" />`. |
| `src/features/globe/components/LayerStatusPanel.jsx` | Tarjeta HUD (abajo a la izquierda) con la capa activa: título, tipo de dato, rango y unidad, fuente y limitaciones. Lee `layer` del registro de sensores. |
| `src/constants/sensors.js` | (`layer.variableId` enlaza cada vista con el catálogo de variables, de donde salen unidad, rango y paleta.) **Registro único de vistas** (`classic`, `terra`, `aqua`): id, etiqueta, sensor, icono, colores hex para Three.js, posición en la mezcla del shader (`shaderMix`), estilo de fronteras (`borders`) y metadatos de la capa (`layer`: `variableId`, tipo de dato, fuente y nota). Hoy Terra y Aqua son `prototype`: texturas ilustrativas con rangos asumidos (LST −40 a 45 °C, SST −2 a 32 °C). Exporta `SENSORS`, `SENSOR_ORDER`, `DEFAULT_SENSOR_ID` (`classic`) y `getSensor(id)`. Store, globo, fronteras y switcher leen de aquí. |

**Tokens fijos** (no cambian con la vista):

| Clase | Valor | Uso |
|---|---|---|
| `bg-space-950` | `#060B14` | Fondo principal / espacio |
| `bg-space-900` | `#0B1322` | Paneles HUD, header, tarjetas |
| `bg-space-800` | `#111D33` | Modales, tooltips, hover |
| `border-hud-border` | slate 18 % | Bordes y divisores |
| `border-hud-crosshair` / `bg-hud-crosshair` | slate 45 % | Retículas y miras |
| `text-ink` | `#F1F5F9` | Texto principal |
| `text-ink-secondary` | `#94A3B8` | Etiquetas y unidades |
| `text-ink-muted` | `#475569` | Texto inactivo, coordenadas de fondo |
| `text-terra-400/500`, `text-aqua-400/500` | ámbar / cian | Solo si un componente necesita un acento **concreto** |
| `font-sans` (por defecto) | Inter | Títulos y UI |
| `font-mono` | JetBrains Mono | Datos y coordenadas (usar con `tabular-nums`) |

**Tokens de sensor** (cambian según el `data-sensor` del contenedor):

| Clase | Terra | Aqua | Uso |
|---|---|---|---|
| `text-/bg-/border-sensor-accent` | `#FBBF24` | `#38BDF8` | Acento principal de la vista |
| `text-/bg-/border-sensor-accent-strong` | `#F59E0B` | `#0EA5E9` | Hover, estado activo |
| `bg-sensor-glow`, `shadow-sensor-glow` | ámbar 25 % | cian 25 % | Halos, fondos de selección |

**Cómo se usa:**

```jsx
// 1. Un contenedor define la vista (hoy: ExplorerLayout).
<div data-sensor="aqua"> ... </div>

// 2. Los componentes NO preguntan qué vista es: usan el token del sensor.
<button className="border border-sensor-accent text-sensor-accent hover:bg-sensor-glow" />

// 3. Si algo solo existe en una vista, usar las variantes:
<OniIndicator className="hidden aqua:block" />   // solo en Aqua
<AltitudeProfile className="terra:block hidden" /> // solo en Terra
```

- Fuera de cualquier `data-sensor` se aplica **classic** (definido en `:root`, igual que `DEFAULT_SENSOR_ID`).
- Para añadir una vista nueva: una entrada en `SENSORS` + su id en `SENSOR_ORDER` (`sensors.js`) y un bloque `[data-sensor="…"]` en `theme.css`. Ningún componente cambia.
- Para colorear un elemento con una vista concreta (no la activa), ponle su propio `data-sensor`: así lo hace `DomainSwitcher` en cada botón.
- El dominio activo vive **solo** en `useTelemetryStore` (`domain`, `setDomain`, `cycleDomain`). `ExplorerLayout` lo lee y aplica `data-sensor` a toda la página; ningún componente debe guardar su propia copia del dominio.

> Three.js no entiende clases de Tailwind: los colores de cada vista están duplicados como hex en `sensors.js` (y los de fondo en `globeConfig.js`). Si se cambia un token, actualizar ambos.

---

## 4. Contratos compartidos (Fase 0)

Todo módulo nuevo se apoya en estos archivos. Cambios aquí se avisan al equipo (ver `plan.md`).

### Stores — `src/stores/`

| Store | Estado | Acciones |
|---|---|---|
| `useTelemetryStore` | `domain` (vista activa) | `setDomain`, `cycleDomain` |
| `useMapStore` | `selectedLocation`, `cameraTarget` | `setLocation(loc, { fly })`, `flyTo`, `clearLocation` |
| `useHoverStore` | `hoveredLocation`, `hoveredFeature` | `setHoveredLocation`, `setHoveredFeature`, `clearHover` |
| `useFiltersStore` | `variableId`, `period { start, end }`, `compareLocations` (máx. 3) | `setVariable`, `setPeriod`, `addCompare`, `removeCompare` |
| `useAssistantStore` | `messages`, `status`, `error` | `addMessage`, `setThinking`, `setIdle`, `setError`, `clear` |
| `useAlertsStore` | `alerts`, `dismissedIds` | `setAlerts`, `dismiss`, `clear`; hook `useVisibleAlerts()` |

- Leer siempre con selector: `useMapStore((s) => s.selectedLocation)`.
- Si el selector devuelve un array/objeto nuevo, envolverlo en `useShallow` (zustand v5).
- Los stores no llaman a servicios: eso lo hacen hooks/servicios de cada módulo.

### Datos — `src/constants/`, `src/services/`, `src/hooks/`

| Archivo | Responsabilidad |
|---|---|
| `constants/variables.js` | Catálogo de variables (`lst`, `sst`): unidad, rango, paleta, dominio, fuente, resolución, producto GIBS y fuente de series. `getVariable(id)`, `VARIABLE_ORDER`, `DEFAULT_VARIABLE_ID`. |
| `config/env.js` | `ENV.useMocks`, `ENV.apiBaseUrl`. Variables en `.env.local` (plantilla: `.env.example`). Nada privado con prefijo `VITE_`. |
| `services/api/httpClient.js` | `getJson(url, { params, cacheTtlMs, retries, timeoutMs, signal })`, `postJson`, `HttpError` (`code`: `TIMEOUT`, `NETWORK`, `HTTP_ERROR`, `PARSE_ERROR`, `ABORTED`). |
| `services/api/serviceResponse.js` | `createServiceResponse(data, meta)`: formato único `{ data, meta }`; valida `variableId`, `source`, `unit`, `period`, `kind`. |
| `services/environmentalDataService.js` | `getTimeSeries({ variableId, location, period, signal })`: punto de entrada único. Usa el proveedor de `variable.series.provider` (hoy `power`); mocks solo con `VITE_USE_MOCKS=true` o si la variable no tiene proveedor. |
| `services/nasa/powerTimeSeries.js` | Adaptador NASA POWER → `{ data, meta }`: serie **mensual real** (`YYYY-MM`) del parámetro de la variable (`precip` → `PRECTOTCORR`, `lst` y `sst` → `TS`), `kind: 'estimate'` (reanálisis MERRA-2). Una llamada por celda trae las 3 variables y queda en caché; peticiones simultáneas a la misma celda se unen. |
| `services/mocks/mockTimeSeries.js` | Series simuladas reproducibles (misma ubicación → misma serie), marcadas `kind: 'prototype'`. Solo para desarrollo sin conexión. |

**Mapa 2D dinámico:** los paneles Celda, Comparar, Periodo y Correlación y las etiquetas de las zonas seleccionadas (`map2d/components/SelectionLabels.jsx`, «A · Piura · ▲ +0,17 °C/déc») usan la tendencia real del centro de cada zona y cambian al cambiar zona, variable o periodo.

**Mapa de tendencia térmica real (fondo del 2D):** cada departamento y celda de mar se pinta con su tendencia de `TS` (°C/década, NASA POWER) en una escala divergente azul → rojo (`TREND_PALETTE`, ±0,5 °C/déc). Opaco = significativa (Mann-Kendall p < 0,05, ≥ 10 años); tenue = no significativa. Global pinta tierra y mar, Terra solo departamentos, Aqua solo mar. La textura ilustrativa solo se ve tenue mientras carga.

| Archivo | Responsabilidad |
|---|---|
| `services/nasa/powerRegionalService.js` | API mensual **regional** de POWER (rejilla 0,5° × 0,625°). Límites comprobados: 2°–10° por eje y 1 parámetro → la vista se parte en mosaicos iguales (Perú: 6), de dos en dos, con caché. |
| `features/map2d/utils/trendGrid.js` | Asigna los puntos de la rejilla a cada zona (dentro del polígono / recuadro; si ninguno, el más cercano ≤ 1°), promedia su serie anual y calcula la tendencia con `trendStats.js` (mismo motor que los paneles). |
| `features/map2d/hooks/useTrendMap.js` + `useTrendMapStore.js` | Descarga y cálculo por país + periodo de filtros; estado compartido con la leyenda y la sonda. |
| `features/map2d/components/TrendChoroplethLayer.jsx` | Capa SVG de color (debajo de `RegionLayer`, que sigue gestionando selección y hover). |
| `features/map2d/components/TrendLegendPanel.jsx` | Leyenda, progreso de descarga, reintento, periodo y fuente. Reemplaza a `LayerStatusPanel` en el 2D. |
| `features/map2d/utils/trendColor.js` | Color y opacidad por pendiente/significancia. |

La sonda (`HoverProbe`) muestra en el 2D la tendencia real de la zona bajo el cursor (`useHoverStore.regionId`).
| `hooks/useEnvironmentalData.js` | `{ data, meta, isLoading, error, isEmpty, isStale, retry }`. Cancela la petición anterior al cambiar la consulta. |
| `features/assistant/constants/mapActions.js` | Tipos de acción del asistente sobre el mapa (`SET_LOCATION`, `SET_VARIABLE`, `SET_PERIOD`, `SET_DOMAIN`). |

### UI kit — `src/components/Hud/`

| Componente | Uso |
|---|---|
| `HudPanel` | `<HudPanel title actions corners as>`: contenedor estándar con marcas `+` en esquinas. |
| `HudButton` | `<HudButton variant="primary\|ghost" icon={Icono}>`: toma el color de la vista activa. |
| `StatTile` | `<StatTile label value unit delta kind />`: indicador numérico; variación neutra ▲/▼. |
| `ColorLegend` | `<ColorLegend title palette range unit />`: misma paleta que el globo. |
| `SourceBadge` | `<SourceBadge meta={meta} />`: tipo · fuente · periodo · resolución · fecha de consulta. |
| `DataState` | `<DataState {...useEnvironmentalData(q)}>…</DataState>`: carga / error con reintento / vacío / desactualizado. |
| `StatusBadge`, `CoordinatePill` | Tipo de dato y coordenadas (ver arriba). |

Ejemplo de bloque de datos completo:

```jsx
const query = useEnvironmentalData({ variableId, location: selectedLocation, period });

<HudPanel title="Serie temporal">
  <DataState {...query}>
    {/* gráfico con query.data */}
    <SourceBadge meta={query.meta} />
  </DataState>
</HudPanel>
```

### Explorador — `src/features/explorer/`

Recorrido guiado por la interacción:
1. **Globo** completo (sin barra ni panel). Clic en un país → la cámara vuela hacia él (un arrastre no cuenta como clic).
2. Si el país está en `constants/countries.js` (piloto: Perú), fundido al **mapa 2D fijo**; aparecen el panel derecho y la barra de pasos **País · Celda · Comparar · Periodo · Ciudad**, habilitados según la selección.
3. **"← Mundo"** o **Escape**: fundido inverso y la cámara se aleja. ← → recorren los pasos disponibles.

Reglas de selección por vista (registro `sensors.js` → `selectableKinds`):

| Vista | Se puede seleccionar | Comparación de 2 zonas |
|---|---|---|
| Classic | departamentos y celdas de mar | mismo tipo → tendencias; tierra + mar → **correlación** (SST vs. lluvia, en σ, con r y p) |
| Terra | solo departamentos | tendencias + veredicto de dipolo |
| Aqua | solo celdas de mar (1°×1°) | tendencias + veredicto de dipolo |

Al cambiar de vista se descartan las zonas que la nueva vista no permite. Zona A = colores Terra, zona B = colores Aqua.

| Archivo | Responsabilidad |
|---|---|
| `hooks/useExplorerStore.js` | `level`, `countryId`, `selectedRegions` (máx. 2, con `marker` y `sensorId`), `stepId`, `notice`; `enterCountry`, `exitToGlobe`, `toggleRegion`, `setSelection`, `pruneSelection`, `goToStep`, `showNotice`. |
| `constants/explorerSteps.js` | Pasos del 2D con `isAvailable(selection)`. |
| `hooks/useCountryEntry.js` | Clic en país → vuelo + entrada al 2D (900 ms); salida con vuelo inverso. Aviso si el país no está habilitado. |
| `hooks/useSelectionContext.js` | Zonas seleccionadas + variable común + periodo + `isCrossKind`. |
| `hooks/useSelectionPruning.js`, `hooks/useFlowKeyboard.js` | Depurar selección al cambiar de vista; teclado (← → Escape). |
| `utils/resolvePresetZones.js` | Convierte las comparaciones de ejemplo (`PRESET_COMPARISONS`) en regiones del mapa. |
| `components/FlowTimeline.jsx`, `components/FlowPanel.jsx` | Barra de pasos (solo en 2D) y contenido del panel con transiciones (se muestra en la pestaña «Zona» del dock). |

### Dock lateral — `src/features/dock/` + `src/stores/useDockStore.js`

Un solo panel a la derecha con pestañas **Zona · Tendencias · Asistente**: muestra un módulo a la vez para que el chat y la información no se superpongan. Se abre con la hamburguesa (arriba a la derecha del mapa) o con el robot (abre «Asistente»).

| Archivo | Responsabilidad |
|---|---|
| `stores/useDockStore.js` | `activeTab` (`null` = cerrado), `openTab(tab)`, `close()`. |
| `components/dockRegistry.js` | `DOCK_TABS` (id, etiqueta, icono, niveles, scroll) y `DOCK_PANELS` (id → componente). Módulo nuevo = añadirlo aquí. |
| `components/SideDock.jsx` | Contenedor responsive: columna que empuja el mapa (≥ lg), panel superpuesto a la derecha (sm–lg), hoja inferior (móvil). |
| `components/DockToggle.jsx` | Botón hamburguesa (abre «Zona» en el país y «Tendencias» en el globo). |
| `hooks/useDockSync.js` | Abre «Zona» al entrar a un país en escritorio y la cierra al volver al globo. |

Responsive del HUD: la sección del mapa es un `@container`; el selector Global/Terra/Aqua baja bajo la ruta «← Mundo / País» cuando el mapa mide menos de 56rem (p. ej. con el dock abierto o en móvil). Las etiquetas «Prototipo visual» se ocultan en `StatusBadge` (la fuente y la nota de cada capa siguen visibles).
| `components/panelRegistry.js` | `PANELS` + `resolvePanelId` (Comparar/Periodo tierra + mar → `correlation`). |
| `components/panels/*` | `CountryPanel`, `CellPanel`, `ComparePanel`, `PeriodPanel`, `CityPanel`, `CorrelationPanel`, bloque `RegionComparison`. Toleran selecciones vacías durante la animación de salida. |

### Mapa 2D — `src/features/map2d/`

Proyección **equirectangular** (d3-geo) ajustada al país + margen de océano: es lineal en lon/lat, así las texturas encajan sin reproyectar.

| Archivo | Responsabilidad |
|---|---|
| `components/CountryMap2D.jsx` | Proyección, capas y coordenadas bajo el cursor (`useHoverStore`). |
| `components/ThermalRasterLayer.jsx` + `hooks/useThermalRaster.js` | Recorta las texturas al área, colorea según `sensor.map2d` con `samplePalette` (misma paleta que el shader del globo). |
| `components/RegionLayer.jsx` | Vecinos (referencia), departamentos (`<path>`) y celdas de mar (`<rect>`); seleccionables con ratón y teclado. |
| `components/SelectionLabels.jsx`, `components/MapBreadcrumb.jsx` | Etiquetas "A · Piura" y ruta "← Mundo / Perú / …". |
| `hooks/useCountryRegions.js` | `viewBbox`, `landRegions` (ADM1 o contorno de respaldo), `oceanRegions`, `contextFeatures`, `usedFallback`. |
| `utils/regionModel.js` | Modelo común de región; `rewindFeature` corrige el sentido de los anillos de GeoJSON estándar para d3. |
| `utils/oceanGrid.js` | Cuadrícula de celdas cuyo centro no cae en tierra; `findCellAt`. |

Compartidos nuevos: `constants/countries.js` (países con 2D), `constants/textures.js` (rutas de texturas), `services/geospatial/boundariesService.js` (ADM1, filtra por `shapeGroup`), `utils/colorScale.js`, `hooks/useElementSize.js`, `features/analysis/utils/correlation.js` (Pearson + p-valor con t de Student).

### Análisis — `src/features/analysis/`

| Archivo | Responsabilidad |
|---|---|
| `utils/trendStats.js` | `senSlope`, `mannKendall`, `analyzeTrend(annual)` → pendiente/década, p-valor, significancia (α = 0,05, ≥ 10 años). |
| `utils/aggregateSeries.js` | `toAnnualMeans` (descarta años con < 80 % de datos), `toAnomalies`, `mergeByYear`. |
| `utils/detectDipole.js` | `dipole` / `partial` / `same` / `insufficient` entre dos tendencias. |
| `hooks/useRegionTrend.js` | Datos + serie anual + tendencia de una región (contrato común de datos). |
| `components/*` | `TrendTile`, `SignificanceBadge`, `DipoleVerdict`. |

#### Análisis con datos reales (NASA POWER / GPM IMERG)

Módulo independiente del explorador, en la pestaña **Tendencias** del dock lateral (globo y mapa 2D). Ficha metodológica completa: [`docs/analisis.md`](docs/analisis.md).

| Archivo | Responsabilidad |
|---|---|
| `data/ica-pisco.json` | Series mensuales verificadas. POWER Ica: `T2M`, `TS`, `PRECTOTCORR` 1981–2025 · POWER mar frente a Pisco: `TS` 1981–2025 · GPM IMERG (vía USF) Ica 2003–2025 (2025 hasta septiembre). |
| `utils/study.js` | Catálogo del estudio (`variables`, `places`, `sources`), agregación anual (`annualSeries`), `analyzeStudy`, `june2025`. Importa el servicio con ruta relativa porque lo usan los tests de Node. |
| `utils/trend.js` | Motor del módulo: OLS + IC Newey–West (Bartlett, 2 rezagos), Mann–Kendall con empates, pendiente de Sen, atípicos (MAD), `findLevelShift`. |
| `utils/format.js` | `format`, `signed`, `precision` (formato es-ES con signo menos tipográfico). |
| `hooks/usePowerPlace.js` | Estado de la consulta en vivo (`idle` / `loading` / `ready` / `error`). |
| `components/AnalysisPanel.jsx` | Contenido de la pestaña «Tendencias»; carga `TrendExplorer` en diferido con `Suspense` y un error boundary. |
| `components/TrendExplorer.jsx` | Selector de variable, lugar y periodo; formulario de consulta en vivo. |
| `components/TrendChart.jsx` | Gráfico SVG anual con tendencia y tabla de valores. |
| `components/TrendResults.jsx` | Veredicto, IC, p, avisos (periodo corto, cambio de nivel) y ficha de procedencia. |

Servicio: `services/nasa/powerService.js` — único punto de acceso a la API mensual por punto de NASA POWER (pública, sin clave). `powerUrl`, `powerCell` (rejilla MERRA-2 0,5° × 0,625°), `parsePowerMonthly`, `fetchPowerMonthly` (límite 30 s, caché en memoria, errores con `code`: `invalid`, `timeout`, `network`, `rejected`, `http`, `format`).

Deuda técnica: `utils/trend.js` (módulo de datos reales) y `utils/trendStats.js` (explorador) conviven con dos implementaciones; las variables `T2M`/`TS`/`PRECTOTCORR` de `study.js` no están unificadas con `constants/variables.js`. Consolidar en una fase posterior.

### Asistente IA — `src/features/assistant/` y `server/`

Robot flotante con chat en streaming. Montado en `ExplorerLayout` (`AssistantProvider` envuelve el layout y `AssistantFab` va al final). Usa tokens propios `bot-*` (`styles/assistant-theme.css`, importado en `index.css`), así que no toca `space-*`, `hud-*` ni `sensor-*`.

| Archivo | Responsabilidad |
|---|---|
| `index.js` | API pública: `AssistantProvider`, `AssistantFab`, `RobotMascot`. |
| `AssistantProvider.jsx` | `AssistantRuntimeProvider` + `useLocalRuntime(chatAdapter)` (`@assistant-ui/react`). |
| `components/AssistantFab.jsx` | Robot fijo: abre la pestaña «Asistente» del dock. Se oculta con el dock abierto y en móvil (ahí se usa la hamburguesa). Prop `position` (en el mapa 2D sube a `bottom-28` para no tapar `FlowTimeline`). |
| `components/AssistantChat.jsx` | Cabecera (mascota + estado) + `Thread`; contenido de la pestaña «Asistente». |
| `components/Thread.jsx` | Mensajes, sugerencias y caja de texto. |
| `components/MarkdownText.jsx` | Markdown GFM con estilos del asistente. |
| `components/RobotMascot.jsx` + `styles/robotMascot.css` | Mascota SVG con 6 estados (`idle`, `listening`, `thinking`, `speaking`, `happy`, `error`). |
| `hooks/useRobotMood.js` | Estado del chat → estado de la mascota. |
| `services/chatAdapter.js` | `POST /api/chat` en streaming; envía `{ messages, context }`. |
| `utils/buildAssistantContext.js` | Lee (sin modificar) `useExplorerStore`, `useFiltersStore`, `useMapStore` y `useTelemetryStore` y arma el contexto de la vista. |
| `prompts/systemPrompt.js` | Prompt de sistema; lo importa el servidor. |
| `constants/mapActions.js` | Contrato de acciones sobre el mapa (aún sin dispatcher). |

Servidor `server/index.js` (Express + AI SDK): `GET /api/health` → `{ ok, mode: "ia"|"demo", provider, model }`; `POST /api/chat` → texto en streaming, `400` sin mensajes, `502` con mensaje claro. Proveedor por `.env` (`AI_PROVIDER` = `google` | `groq` | `openai`, `AI_MODEL`, key del proveedor, `PORT`, `AI_TIMEOUT_MS`). Sin key funciona en **modo demo**. El contexto del cliente se anexa al prompt (máx. 2000 caracteres) marcado como "no son mediciones". La key vive solo en el servidor; en desarrollo Vite reenvía `/api` a `localhost:3001`.

`useAssistantStore` se conserva sin uso (el chat vive en el runtime de assistant-ui); queda para historial/persistencia.

### Gráficos — `src/components/charts/`

| Archivo | Responsabilidad |
|---|---|
| `chartRegistry.js` | `CHART_TYPES`: tipo → componente. Gráfico nuevo = crear el componente y registrarlo. |
| `ChartBlock.jsx` | `<ChartBlock title type state meta chartProps />`: panel + estados de datos + gráfico + fuente. |
| `TimeSeriesChart.jsx` | Líneas multi-serie (Recharts). Props: `data`, `series [{ key, label, color }]`, `unit`. |
| `chartTheme.js` | Colores, tipografía y tooltip comunes. |

### Globo — piezas nuevas

| Archivo | Responsabilidad |
|---|---|
| `features/globe/components/CameraRig.jsx` | Vuela la cámara a `useMapStore.cameraTarget` sobre la esfera; se cancela si el usuario arrastra. |
| `features/globe/components/RegionMarkers.jsx` / `RegionMarker.jsx` | Celda (bbox), pulso y etiqueta de cada región de `highlightedRegionIds`. |

### Constantes nuevas

| Archivo | Contenido |
|---|---|
| `constants/regions.js` | Regiones del dipolo: `piura` (polo húmedo), `puno` (polo seco), `nino12` (forzante). Rol, color, centro, bbox, variables. |
| `constants/periods.js` | `PERIOD_PRESETS` (1981–2024 POWER, 2001–2024 era MODIS/GPM). |
| `constants/palettes.js` | `PRECIPITATION_PALETTE` (marrón → azul). |
| `constants/variables.js` | + `precip` (variable principal del dipolo). |

### Carpetas aún vacías

| Carpeta | Qué irá ahí |
|---|---|
| `src/features/` | `filters/`, `dashboard/`, `alerts/`, `assistant/`, `history/` (misma estructura que `globe/`). |
| `src/services/nasa/` | Ya contiene `powerService.js` (NASA POWER mensual). Falta: GIBS y adaptar POWER a la firma de `getTimeSeries`. |
| `src/services/geospatial/` | Geocodificación (buscar lugar ↔ coordenadas). |
| `src/providers/`, `src/assets/` | Si se necesitan. |

---

## 5. Convenciones

- **Componentes:** un componente por archivo, nombre en PascalCase (`EarthGlobe.jsx`), `export default`.
- **Funciones:** camelCase (`latLonToCartesian`). Funciones de más de 100 líneas deben dividirse y documentarse.
- **Estructura de una feature:**
  ```
  features/<nombre>/
  ├─ components/
  ├─ constants/
  ├─ hooks/
  └─ utils/
  ```
- **Separación de responsabilidades:** componentes → hooks → servicios → cliente HTTP. **Nunca** hacer `fetch` dentro de un componente visual.
- **Configuración sobre código:** valores ajustables (colores, rangos, URLs) en `constants/` o `config/`.
- **Estilos:** solo Tailwind y tokens de `theme.css`; evitar colores hex sueltos en JSX.
- **Credenciales:** nada privado en el cliente. Todo lo que empieza con `VITE_` queda expuesto en el navegador; las claves de IA o Earthdata deben ir en un backend o proxy.
- **Rigor científico:** toda visualización de datos debe mostrar fuente, unidad, periodo y resolución.

---

## 6. Cómo extender

### Agregar una capa al globo
1. Crear `src/features/globe/components/layers/<NombreCapa>.jsx`.
2. Usar `latLonToCartesian` para posicionar elementos sobre la esfera.
3. Montarla como hijo: `<EarthGlobe><NombreCapa /></EarthGlobe>`.

### Agregar una ruta
1. Añadir la URL en `ROUTE_PATHS` (`routePaths.js`).
2. Crear la página en `src/pages/`.
3. Registrar la ruta en `appRouter.jsx`.

### Agregar una feature
1. Crear `src/features/<nombre>/` con la estructura indicada.
2. Si consume datos: servicio en `src/services/` + hook en la feature.
3. Componerla en `ExplorerPage.jsx` o en el layout.

---

## 7. Comandos

```bash
npm install     # instalar dependencias
npm run dev     # web (5173) + servidor del asistente IA (3001)
npm run dev:web # solo la web
npm run dev:api # solo el servidor del asistente
npm run build   # build de producción
npm run lint    # revisar con ESLint
npm test        # tests de datos reales y tendencias (node --test, tests/*.test.mjs)
```

---

## 8. Pendiente (próximos pasos)

- [ ] Estado compartido (`stores/`) para mapa, filtros y asistente.
- [ ] Catálogo de variables en `constants/` (empezar por temperatura superficial LST/SST).
- [x] Adaptador NASA POWER para series mensuales (`services/nasa/powerService.js`).
- [ ] Adaptador GIBS para texturas.
- [ ] Consolidar `analysis/utils/trend.js` y `analysis/utils/trendStats.js` en un solo motor.
- [ ] Textura real de la Tierra y capa térmica sobre el globo.
- [ ] Panel de filtros (ubicación, variable, periodo) y leyenda.
- [ ] Dashboard de indicadores y gráficos.
- [ ] Alertas por umbral.
- [x] Asistente IA vía backend (`server/index.js`), con contexto de la vista actual.
- [ ] Acciones del asistente sobre el mapa (`mapActions.js` + `dispatchMapActions.js`, tool calling).
- [ ] Inyectar datos reales (p. ej. resultados de `analysis/utils/study.js`) en el contexto del asistente.
- [ ] Reverse proxy de `/api` y rate limit para producción.
- [ ] Layout responsive (móvil: paneles como hojas inferiores).


## Responsabilidades actuales
ExplorerLayout.jsx	Header, HUD, Edge Hint y estructura general.
DomainSwitcher.jsx	Conmutador TERRA/AQUA.
GlobeCanvas.jsx	Escena 3D y controles de cámara.
EarthGlobe.jsx	Geometría, superficie y transiciones shader.
GlobeGraticule.jsx	Retícula geográfica.
useDomainShortcut.js	Atajo [Espacio] para ciclar el dominio (usa useTelemetryStore; montar una sola vez).