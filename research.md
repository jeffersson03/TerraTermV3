# TerraTerm — Guía de investigación de datos (dipolo climático · Perú)

> Qué datos reunir, de dónde, en qué formato entregarlos y en qué orden.
> Plantilla de entrega: [`assets-src/research/plantilla_series.csv`](assets-src/research/plantilla_series.csv).
> Mientras no estén, la app usa **datos simulados** marcados como "Prototipo visual".

---

## 1. Qué tiene que demostrar la plataforma

**Hipótesis del MVP:** un forzante oceánico (anomalía cálida en la región Niño 1+2) produce tendencias **opuestas y simultáneas**:

| Polo | Región piloto | Señal esperada |
|---|---|---|
| Húmedo (A) | Costa norte · **Piura** | Más lluvia extrema → inundaciones, brotes epidémicos |
| Seco (B) | Sierra sur · **Puno** | Menos lluvia → sequía, estrés de vegetación |
| Forzante (Δ) | Océano · **Niño 1+2** (0–10° S, 90–80° O) | Anomalía de temperatura del mar |

La app ya calcula, para cada región y variable:
- **Pendiente de Sen** (cambio por década) y **prueba de Mann-Kendall** (¿es significativa al 95 %?).
- **Dipolo detectado** = ambas regiones con tendencia significativa y de signo opuesto.

Por eso necesitamos **series largas (≥ 10 años, ideal 20+)**, **mensuales**, **por región** y de **fuentes NASA trazables**.

---

## 2. Datos recomendados (pocos y significativos)

Prioridad 1 → imprescindible para la demo. Prioridad 3 → si sobra tiempo.

| Prio. | Variable (`variable_id`) | Producto NASA | Resolución · periodo | Para qué | Cómo obtenerlo |
|---|---|---|---|---|---|
| **1** | Precipitación (`precip`) | **NASA POWER** `PRECTOTCORR` (MERRA-2 corregida) | 0,5° × 0,625° · mensual · 1981–hoy | Serie larga para la tendencia en A y B | API sin registro (ver §4.1) — **la puedo conectar yo directamente** |
| **1** | Precipitación (`precip`) | **GPM IMERG Final mensual** `GPM_3IMERGM` v07 | 0,1° · 2000–hoy | Confirmar con satélite (más detalle espacial) | Giovanni → *Area-Averaged Time Series* sobre el bbox de cada región |
| **1** | Temperatura del mar (`sst`) | **GHRSST MUR L4** (JPL / PO.DAAC) o **MODIS-Aqua SST** | 1 km / 4 km · 2002–hoy | Forzante oceánico en Niño 1+2 | Giovanni (si está disponible) o PO.DAAC; promedio del bbox Niño 1+2 |
| **2** | Vegetación (`ndvi`, nueva) | **MODIS** `MOD13A3` v061 (NDVI mensual) | 1 km · 2000–hoy | Impacto de la sequía en Puno / verdor en Piura | AppEEARS → *Area Sample* con el polígono de la región → CSV de estadísticas |
| **2** | Humedad del suelo (`soil`, nueva) | **NASA POWER** `GWETROOT` (MERRA-2) · **SMAP** `SPL3SMP_E` | 0,5° / 9 km · 1981– / 2015– | Sequía agrícola | POWER (API) · SMAP vía AppEEARS |
| **2** | Temp. superficial (`lst`) | **MODIS** `MOD11A2` v061 (LST día) | 1 km · 8 días · 2000–hoy | Calor asociado a sequía | AppEEARS → Area Sample |
| **3** | Agua total (`tws`, nueva) | **GRACE / GRACE-FO** mascons JPL | ~3° · mensual · 2002–hoy (hueco 2017–18) | Pérdida de agua subterránea en el sur | PO.DAAC |
| **3** | Escena urbana (paso "Ciudad") | **ECOSTRESS** `ECO_L2T_LSTE` v002 · **Landsat 8/9** C2 L2 (ST_B10) | 70 m · 100 m · escenas puntuales | Detalle de calor en Piura durante un evento | AppEEARS → un GeoTIFF por escena |

**Contexto no-NASA (opcional, citar aparte):** índice Niño 1+2 / ICEN (NOAA CPC · ENFEN Perú) y casos de dengue (CDC-MINSA Perú). Útiles para la narrativa, pero se muestran como "fuente externa".

### Eventos de referencia para verificar en las series
Confirmar fechas e impacto con las fuentes antes de mostrarlos:
- **El Niño 1997–98** (fuerte señal en la costa norte; solo cubierto por POWER).
- **El Niño costero 2017** (feb–mar, inundaciones en Piura).
- **Ciclón Yaku y El Niño costero 2023** (mar 2023, lluvias e inundaciones en el norte; epidemia de dengue).
- **Sequía en el sur 2022–2023** (déficit de lluvias en el altiplano / Puno).

---

## 3. Regiones (confirmar)

Definidas en [`src/constants/regions.js`](src/constants/regions.js). Los bbox son **aproximados**: ajústalos al área que uses en Giovanni / AppEEARS y dímelos.

| `region_id` | Centro (lat, lon) | bbox [oeste, sur, este, norte] |
|---|---|---|
| `piura` | −5,19 · −80,63 | [−81,3, −6,4, −79,4, −4,1] |
| `puno` | −15,84 · −70,02 | [−71,1, −17,3, −68,8, −13,0] |
| `nino12` | −5,0 · −85,0 | [−90, −10, −80, 0] |

Si prefieres usar el **límite departamental** (polígono) en lugar del rectángulo, en AppEEARS puedes subir un GeoJSON/shapefile: guárdalo en `assets-src/research/` y lo uso también para dibujar la celda en el globo.

---

## 4. Cómo obtener cada fuente

### 4.1 NASA POWER (sin registro) — Prioridad 1
URL de ejemplo (Piura, mensual):

```
https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=PRECTOTCORR,GWETROOT,TS&community=AG&latitude=-5.19&longitude=-80.63&start=1981&end=2024&format=JSON
```

No hace falta que lo descargues: lo conectaré como servicio (`services/nasa/powerService.js`). Solo **confirma** que la URL te devuelve datos en el navegador.

### 4.2 Giovanni (NASA GES DISC) — Prioridad 1
1. Inicia sesión con **Earthdata Login** (gratuito).
2. Servicio: **Time Series, Area-Averaged**.
3. Variable: *Precipitation (GPM_3IMERGM v07)*.
4. Fechas: 2001-01 a 2024-12. Región: bbox de la tabla §3.
5. Descarga el **CSV** y vuelca los valores en la plantilla.

> Ojo con las unidades: IMERG mensual suele venir en **mm/h** (tasa media). Anota la unidad tal cual en `unit`; la conversión la hago yo.

### 4.3 AppEEARS — Prioridad 2
1. Earthdata Login → **Extract → Area Sample**.
2. Sube el polígono de la región, rango 2001-01-01 a 2024-12-31.
3. Producto: `MOD13A3.061` (NDVI) y/o `MOD11A2.061` (LST_Day_1km).
4. Formato **GeoTIFF**; al terminar, descarga el archivo **`*-Statistics.csv`** (media por fecha). Ese CSV es lo que necesito.

---

## 5. Formato de entrega

Un CSV por fuente (o uno solo), con **una fila por región, variable y fecha**, siguiendo la plantilla:

| Columna | Ejemplo | Regla |
|---|---|---|
| `region_id` | `piura` | Uno de §3 |
| `variable_id` | `precip` | `precip`, `sst`, `lst`, `ndvi`, `soil`, `tws` |
| `date` | `2017-03` | `YYYY-MM` (mensual) o `YYYY-MM-DD` |
| `value` | `4.82` | Punto decimal, sin separador de miles. Vacío si falta |
| `unit` | `mm/día` | Tal como la da la fuente |
| `source` | `NASA GES DISC (Giovanni)` | Organismo / portal |
| `product` | `GPM_3IMERGM` | Nombre corto del producto |
| `version` | `07` | Versión / colección |
| `spatial_method` | `area_mean_bbox` | `point`, `area_mean_bbox`, `area_mean_polygon` |
| `resolution` | `0.1°` | Resolución nativa |
| `url` | enlace de descarga o DOI | Para la trazabilidad en la UI |
| `retrieved_at` | `2026-11-15` | Fecha de descarga |
| `notes` | `nubes > 50 % en 2017-02` | Limitaciones |

Con eso genero los archivos de datos semilla, los conecto al mismo servicio que hoy usa los mocks (`environmentalDataService`) y la app pasa de "Prototipo visual" a "Observación" / "Estimación" sin cambiar ningún componente.

---

## 6. Checklist de calidad (antes de entregarme un archivo)

- [ ] ≥ 10 años completos por región (ideal 2001–2024).
- [ ] Mismo periodo y misma variable en ambas regiones.
- [ ] Sin huecos largos; si los hay, anotarlos en `notes`.
- [ ] Unidad y producto anotados en cada fila.
- [ ] Enlace o DOI de la fuente.
