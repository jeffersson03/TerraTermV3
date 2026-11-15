# Plan de integración — datos reales de análisis (NASA POWER / GPM IMERG)

> Base: `integration.md` (estructura actual) y `doc.md` (documentación oficial).
> Fuente de los cambios: `Terraterm_parche_final_sobre_4631481.diff`.
> Objetivo: integrar **solo los datos y el módulo de análisis** sin romper el globo, el mapa 2D, el explorador ni los estilos existentes.

---

## 1. Qué se integra realmente

### 1.1 Datos (lo único que es “datos”)

| Dato | Archivo destino | Contenido | Origen |
|---|---|---|---|
| Series mensuales verificadas | `src/features/analysis/data/ica-pisco.json` | POWER Ica: `T2M`, `TS`, `PRECTOTCORR` 1981–2025 · POWER Pisco: `TS` 1981–2025 · IMERG Ica: 2003–2025 (2025 hasta septiembre) | NASA POWER / GPM IMERG-USF |
| Consulta en vivo | `src/services/nasa/powerService.js` | Endpoint `power.larc.nasa.gov`, cobertura 1981–2025, parámetros `T2M,TS,PRECTOTCORR`, rejilla 0,5° × 0,625°, caché en memoria | NASA POWER API |
| Ficha metodológica | `docs/analisis.md` | Fuentes, agregación, IC Newey–West, Mann–Kendall, Sen, verificación | Documentación del parche |
| Fixtures de verificación | `tests/power.test.mjs`, `tests/trend.test.mjs` | Valores esperados que demuestran que los datos reales reproducen los resultados | Derivados del JSON |

No se integran texturas, GeoJSON ni datos de mapas nuevos. `public/geo/` y `public/textures/` no se tocan.

### 1.2 Código nuevo que acompaña a los datos

| Archivo del parche | Destino propuesto | Tipo |
|---|---|---|
| `src/features/analysis/TrendExplorer.jsx` | `src/features/analysis/components/TrendExplorer.jsx` | UI |
| `src/features/analysis/TrendChart.jsx` | `src/features/analysis/components/TrendChart.jsx` | UI |
| `src/features/analysis/TrendResults.jsx` | `src/features/analysis/components/TrendResults.jsx` | UI |
| `src/features/analysis/usePowerPlace.js` | `src/features/analysis/hooks/usePowerPlace.js` | Hook |
| `src/features/analysis/study.js` | `src/features/analysis/utils/study.js` | Lógica de estudio |
| `src/features/analysis/trend.js` | `src/features/analysis/utils/trend.js` | Estadística |
| `src/features/analysis/format.js` | `src/features/analysis/utils/format.js` | Formato |
| `src/features/analysis/data/ica-pisco.json` | `src/features/analysis/data/ica-pisco.json` | Datos |
| `src/services/nasa/powerService.js` | `src/services/nasa/powerService.js` | Servicio NASA |
| `tests/power.test.mjs` | `tests/power.test.mjs` | Test |
| `tests/trend.test.mjs` | `tests/trend.test.mjs` | Test |
| `docs/analisis.md` | `docs/analisis.md` | Documentación |

### 1.3 Archivos existentes que se modifican

| Archivo | Cambio | Motivo |
|---|---|---|
| `package.json` | Añadir `"test": "node --test"` | Ejecutar los tests sin dependencias nuevas |
| `vite.config.js` | Alias `@` usando `import.meta.url`/`fileURLToPath` (o `import.meta.dirname` si Node ≥ 20.11) | Evitar fallo de `__dirname` en ESM |
| `src/layouts/ExplorerLayout.jsx` | `<main>` con `min-h-0 overflow-y-auto` | Permitir scroll del panel de análisis |
| `src/pages/ExplorerPage.jsx` | Componer globo + `TrendExplorer`, `lazy` + `Suspense` + error boundary | Integrar el módulo sin bloquear el globo |
| `src/styles/theme.css` | Solo si se opta por alias de tokens (ver §3) | Evitar clases inexistentes |
| `doc.md` | Actualizar secciones 2, 3, 4, 7, 8 | Mantener la documentación oficial al día |
| `integration.md` | Actualizar el árbol y quitar “Falta `services/nasa/`” | Reflejar la estructura real |

---

## 2. Estructura de carpetas objetivo

La estructura del parche **no respeta** la convención de `doc.md` (§5): los componentes y utilidades quedaron en la raíz de `features/analysis/`. Hay que reubicarlos.

```text
src/
├── features/
│   └── analysis/
│       ├── components/
│       │   ├── TrendChart.jsx          ← nuevo
│       │   ├── TrendExplorer.jsx       ← nuevo
│       │   ├── TrendResults.jsx        ← nuevo
│       │   └── (TrendTile, SignificanceBadge, DipoleVerdict existentes)
│       ├── data/
│       │   └── ica-pisco.json          ← nuevo (datos reales)
│       ├── hooks/
│       │   ├── usePowerPlace.js        ← nuevo
│       │   └── useRegionTrend.js       ← existente, no tocar
│       └── utils/
│           ├── format.js               ← nuevo
│           ├── study.js                ← nuevo
│           ├── trend.js                ← nuevo
│           └── (trendStats, aggregateSeries, detectDipole, correlation existentes)
├── services/
│   └── nasa/
│       └── powerService.js             ← nuevo
tests/
├── power.test.mjs                      ← nuevo
└── trend.test.mjs                      ← nuevo
docs/
└── analisis.md                         ← nuevo
```

Reglas:

- **No mover ni renombrar** los archivos existentes de `features/analysis/`.
- Los nuevos archivos conviven con los existentes; no se reemplaza `trendStats.js` por `trend.js` en esta fase.
- `data/` dentro de la feature es aceptable porque el JSON se importa de forma síncrona y los tests lo leen del disco. Si en el futuro crece, se puede mover a `public/data/` y cargarlo con `fetch`.
- `constants/studyConfig.js` es una mejora opcional posterior (ver §7), no un requisito para esta integración.

---

## 3. Ajustes obligatorios antes de compilar

### 3.1 Imports: usar siempre `@/`

`doc.md` exige el alias `@/`. El parche mezcla rutas relativas y alias:

| Archivo | Import del parche | Import correcto |
|---|---|---|
| `utils/study.js` | `../../services/nasa/powerService.js` | `@/services/nasa/powerService.js` |
| `hooks/usePowerPlace.js` | `../../services/nasa/powerService.js` | `@/services/nasa/powerService.js` |
| `components/TrendExplorer.jsx` | `./data/ica-pisco.json`, `./study.js`, `./TrendChart.jsx`, `./usePowerPlace.js` | `../data/ica-pisco.json`, `../utils/study.js`, `./TrendChart.jsx`, `../hooks/usePowerPlace.js` |
| `components/TrendResults.jsx` | `./format.js`, `./study.js` | `../utils/format.js`, `../utils/study.js` |
| `utils/study.js` | `./format.js`, `./trend.js` | se mantienen (mismo directorio) |
| Tests | `../src/features/analysis/study.js` | `../src/features/analysis/utils/study.js` |
| Tests | `../src/features/analysis/trend.js` | `../src/features/analysis/utils/trend.js` |

### 3.2 Tokens CSS inexistentes

El parche usa clases que **no existen** en `src/styles/theme.css` según `integration.md`. Si se aplican tal cual, el gráfico y los paneles quedan sin color/borde.

| Clase del parche | Reemplazo recomendado |
|---|---|
| `bg-void` | `bg-space-950` |
| `bg-void/65`, `bg-void/50` | `bg-space-950/65`, `bg-space-950/50` |
| `bg-elevated/60` | `bg-space-800/60` |
| `border-grid` | `border-hud-border` |
| `stroke-grid` | `stroke-hud-border` |
| `text-terra` | `text-terra-400` |
| `border-terra/50` | `border-terra-400/50` |
| `border-terra/30` | `border-terra-400/30` |
| `bg-terra/10` | `bg-terra-400/10` |
| `bg-terra/8` | `bg-terra-400/10` (o `bg-terra-400/[0.08]`) |
| `outline-aqua` | `outline-aqua-400` |
| `var(--color-terra)` | `var(--color-terra-400)` |
| `var(--color-aqua)` | `var(--color-aqua-400)` |

`text-ink`, `text-ink-secondary`, `text-ink-muted`, `fill-ink-secondary`, `border-t`, `border-b`, etc. sí existen y se mantienen.

Alternativa rápida (no recomendada por duplicar tokens): añadir en `theme.css` alias `--color-void`, `--color-elevated`, `--color-grid`, `--color-terra`, `--color-aqua`. Si se elige esta vía, documentarlo y no usarla en componentes nuevos.

### 3.3 Colores de las series del gráfico

`TrendChart.jsx` define:

```js
const seriesColors = ['var(--color-terra)', 'var(--color-aqua)']
```

Debe quedar:

```js
const seriesColors = ['var(--color-terra-400)', 'var(--color-aqua-400)']
```

Sin esto, las líneas del SVG no se pintan porque esas variables no existen.

---

## 4. Compatibilidad con el código existente

### 4.1 `ExplorerPage.jsx`

El parche asume que la página solo contiene `GlobeCanvas`. Antes de aplicarlo:

1. Abrir el `ExplorerPage.jsx` real.
2. Si ya compone `map2d`, `explorer`, filtros o paneles, **no reemplazar el archivo**: injertar `TrendExplorer` en el layout existente.
3. Mantener el globo como hijo de `GlobeBoundary` y `Suspense`; el error boundary evita que un fallo de WebGL tumbe el análisis.
4. Verificar que el globo sigue recibiendo su altura (`h-[min(33svh,270px)]` en móvil y `lg:h-[calc(100dvh-3rem)]` en escritorio).

### 4.2 `ExplorerLayout.jsx`

El cambio a `overflow-y-auto` es necesario para que el panel derecho tenga scroll. Riesgo: si alguna vista existente usaba `absolute inset-0` para cubrir el `<main>`, el scroll puede alterar su alto. Verificar:

- Globo 3D.
- Mapa 2D (`CountryMap2D`).
- Flujo del explorador (`FlowPanel`, `FlowTimeline`).
- Sonda (`HoverProbe`).

Si algo se rompe, aislar el scroll al contenedor de `TrendExplorer` en lugar de cambiar `<main>`.

### 4.3 Duplicación estadística

`features/analysis/utils/trendStats.js` ya existe según `doc.md`. El parche añade `trend.js` con otra implementación (Sen, Mann–Kendall, Newey–West, cambio de nivel).

Decisión para esta fase:

- **Mantener ambos.** No borrar ni reescribir `trendStats.js`.
- No cambiar `useRegionTrend.js` ni los componentes `TrendTile`/`SignificanceBadge`/`DipoleVerdict`.
- Documentar en `doc.md` que `trend.js` es el motor del módulo de datos reales y `trendStats.js` sigue siendo el motor del explorador.
- Consolidar en una fase posterior, con tests de ambos módulos.

### 4.4 Variables duplicadas

`study.js` define `T2M`, `TS`, `PRECTOTCORR`; `constants/variables.js` ya tiene `precip` y `lst`/`sst`. No unificar ahora: son catálogos con contratos distintos. Anotarlo como deuda técnica en `doc.md`.

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Aplicar el `.diff` a ciegas y dejar archivos en la raíz de `analysis/` | No usar `git apply`; copiar archivo por archivo al destino de §1.2 |
| Clases Tailwind inexistentes | Aplicar §3.2 antes de compilar |
| `import.meta.dirname` no soportado | Usar `fileURLToPath(new URL('./src', import.meta.url))`; comprobar `node -v` |
| `node --test` no encuentra tests | Los tests son `.mjs` y no importan JSX; ejecutar desde la raíz |
| El test de POWER depende de valores exactos | No redondear ni cambiar `trend.js`/`study.js` durante la integración |
| Caché del servicio entre tests | Mantener coordenadas distintas por test; no reutilizar el módulo entre casos |
| Datos de 2025 incompletos en IMERG | Mantener la nota de `docs/analisis.md`; el cálculo ya usa años completos comunes |
| El globo pierde altura o deja de ser interactivo | Probar `ExplorerPage` antes y después; ajustar solo el contenedor del análisis |
| El JSON aumenta el bundle | Es pequeño (~220 líneas); si crece, mover a `public/data/` con carga diferida |

---

## 6. Plan de ejecución por fases

### Fase 0 — Respaldo y línea base

1. Confirmar que el proyecto real es el que describe `integration.md` (no este directorio de documentos).
2. Crear rama o copia de seguridad:
   ```bash
   git checkout -b feat/analisis-datos-reales
   ```
   Si no hay git, comprimir el proyecto antes de tocar nada.
3. Verificar que la línea base compila:
   ```bash
   npm install
   npm run lint
   npm run build
   ```

### Fase 1 — Datos y servicio (sin UI)

1. Crear `src/features/analysis/data/` y copiar `ica-pisco.json`.
2. Crear `src/services/nasa/powerService.js`.
3. Añadir `"test": "node --test"` a `package.json`.
4. Copiar los tests a `tests/` y ajustar sus imports a `utils/study.js` y `utils/trend.js` (los archivos aún no existen; se crean en la fase 3).
5. Ejecutar los tests cuando las utilidades existan. Verificación parcial: `node --test tests/power.test.mjs`.

Punto de control: el JSON carga, el servicio exporta `powerUrl`, `powerCell`, `parsePowerMonthly`, `fetchPowerMonthly` y los tests de URL/rejilla pasan.

### Fase 2 — Utilidades del análisis

1. Crear `src/features/analysis/utils/format.js`.
2. Crear `src/features/analysis/utils/trend.js`.
3. Crear `src/features/analysis/utils/study.js` y cambiar el import del servicio a `@/services/nasa/powerService.js`.
4. Ajustar los imports de los tests.
5. Ejecutar:
   ```bash
   npm test
   ```
   Deben pasar los 11 tests (6 de POWER + 5 de tendencias).

Punto de control: mismos números que `docs/analisis.md` (+0,37 °C/década en Ica 2003–2025; +0,1314 y −0,2144 en TS 1981–2025; 122,4 vs 1,303 mm en junio de 2025).

### Fase 3 — Hook y componentes

1. Crear `src/features/analysis/hooks/usePowerPlace.js` con import `@/services/nasa/powerService.js`.
2. Crear `src/features/analysis/components/TrendChart.jsx`.
3. Crear `src/features/analysis/components/TrendResults.jsx`.
4. Crear `src/features/analysis/components/TrendExplorer.jsx`.
5. Aplicar §3.1 (imports) y §3.2/§3.3 (tokens y colores).
6. Ejecutar `npm run lint` y `npm run build`.

Punto de control: el módulo compila aislado; aún no está montado en `ExplorerPage`.

### Fase 4 — Montaje en la aplicación

1. Modificar `src/pages/ExplorerPage.jsx`:
   - `lazy(() => import('@/features/globe/components/GlobeCanvas'))`.
   - `GlobeBoundary` para errores de WebGL.
   - `Suspense` con mensaje de carga.
   - Layout `lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(440px,48%)]`.
   - Montar `<TrendExplorer />`.
   - Si la página real ya tiene más contenido, integrar sin borrar lo existente.
2. Modificar `src/layouts/ExplorerLayout.jsx` (`min-h-0 overflow-y-auto`).
3. Ajustar `vite.config.js` si `import.meta.dirname` no es compatible.
4. Ejecutar de nuevo `npm run build` y `npm run lint`.

Punto de control: globo y análisis conviven; el globo conserva interacción y el panel derecho hace scroll.

### Fase 5 — Documentación y estructura

1. Copiar `docs/analisis.md`.
2. Actualizar `doc.md`:
   - §2: flujo de `ExplorerPage` con globo + análisis.
   - §3: nuevos archivos de `analysis/` y `services/nasa/powerService.js`.
   - §4: subsección “Análisis con datos reales” con fuente, periodo, resolución y enlace a `docs/analisis.md`.
   - §7: añadir `npm test`.
   - §8: marcar como hecho el adaptador NASA POWER; dejar pendiente la consolidación de `trendStats.js`/`trend.js`.
3. Actualizar `integration.md`:
   - Añadir `analysis/data/`, `analysis/components/Trend*`, `analysis/hooks/usePowerPlace.js`, `analysis/utils/{study,trend,format}.js`, `services/nasa/powerService.js`, `tests/`, `docs/analisis.md`.
   - Eliminar la nota “Falta `services/nasa/`”.
4. No tocar `.claude/` salvo que el equipo quiera registrar la convención `features/<name>/data/`.

### Fase 6 — Verificación final

Ejecutar en orden:

```bash
npm test
npm run lint
npm run build
npm run dev
```

Pruebas manuales:

1. **Aire en Ica**: T2M, Ica, 2003–2025 → 23 puntos, +0,37 °C/década, IC +0,17 a +0,58, p = 0,0031.
2. **Tierra y mar**: TS, “Ica y mar frente a Pisco”, 1981–2025 → evidencia en ambas; 2003–2025 → evidencia insuficiente.
3. **Lluvia**: PRECTOTCORR, Ica → POWER e IMERG, aviso de cambio de nivel 2015 y junio de 2025 (122,4 vs 1,30 mm).
4. **Consulta en vivo**: “Otro lugar”, −14.07 y −75.73, T2M 2003–2025 → mismas cifras que Ica.
5. **Regresión**: globo 3D, cambio Classic/Terra/Aqua, mapa 2D, flujo del explorador, sonda, responsive móvil.
6. **Consola**: sin errores de WebGL, sin warnings de clases inexistentes, sin 404 de datos.

---

## 7. Mejoras posteriores (no bloquean esta integración)

1. Mover `variables`, `places` y `sources` de `utils/study.js` a `features/analysis/constants/studyConfig.js`, dejando re-exports para no romper tests.
2. Unificar `trend.js` con `trendStats.js` en un solo motor y decidir qué métricas conserva cada módulo.
3. Evaluar `features/analysis/data/` frente a `public/data/` si el JSON crece o se añaden más estudios.
4. Integrar `TrendChart` en `chartRegistry.js` si se quiere reutilizar desde otros paneles.
5. Añadir un selector de estudio (Ica/Pisco/otro) en lugar de variables y lugares fijos.

---

## 8. Criterios de aceptación

- [ ] Los datos viven en `src/features/analysis/data/ica-pisco.json` y no se duplican.
- [ ] `src/services/nasa/powerService.js` es el único punto de acceso a NASA POWER.
- [ ] Los archivos nuevos respetan `features/analysis/{components,hooks,utils}`.
- [ ] Todos los imports usan `@/` cuando cruzan de módulo.
- [ ] No quedan clases `bg-void`, `border-grid`, `text-terra`, `outline-aqua` ni `var(--color-terra)` sin resolver.
- [ ] `npm test` pasa (11 tests).
- [ ] `npm run lint` pasa.
- [ ] `npm run build` pasa.
- [ ] El globo, el mapa 2D y el explorador siguen funcionando.
- [ ] `doc.md` e `integration.md` reflejan la nueva estructura y los datos.
- [ ] `docs/analisis.md` explica fuentes, métodos y limitaciones.

---

## 9. Rollback

Si algo falla, revertir solo esta integración:

1. Borrar los archivos nuevos listados en §1.2.
2. Revertir los cambios de `package.json`, `vite.config.js`, `ExplorerLayout.jsx`, `ExplorerPage.jsx` y `theme.css`.
3. Revertir `doc.md`, `integration.md` y borrar `docs/analisis.md`.
4. `npm install && npm run build`.

No hay migraciones de datos ni cambios en `public/`; el rollback es seguro.
