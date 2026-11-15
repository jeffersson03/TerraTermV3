import { THERMAL_PALETTE } from "@/constants/thermalPalette";
import { PRECIPITATION_PALETTE } from "@/constants/palettes";

// Catálogo de variables ambientales. Cada variable es CONFIGURACIÓN, no código:
// agregar una (humedad del suelo, precipitación, NDVI, nieve…) es añadir una
// entrada aquí; ningún componente cambia.
//
// Campos:
//   id, label, shortLabel   → identificación y textos de UI
//   unit, range, palette    → escala de color y leyenda (range = [mín, máx] en `unit`)
//   domain                  → dónde aplica: 'land' | 'ocean' | 'both'
//   source, resolution      → procedencia y resolución del producto científico
//   layer                   → de dónde sale la capa del globo (proveedor + id del producto)
//   series                  → de dónde salen las series temporales por punto
//   activities              → actividades productivas relacionadas
//
// Los identificadores de productos NASA se validan en la Fase 2 (datos reales).
export const VARIABLES = Object.freeze({
  precip: {
    id: "precip",
    label: "Precipitación",
    shortLabel: "PRECIP",
    unit: "mm/día",
    range: [0, 15],
    palette: PRECIPITATION_PALETTE,
    domain: "land",
    source: "NASA POWER (MERRA-2 corregida) · NASA GPM IMERG",
    resolution: "0,5° × 0,625° (POWER) · 0,1° (IMERG)",
    layer: { provider: "gibs", productId: "IMERG_Precipitation_Rate" },
    series: { provider: "power", parameter: "PRECTOTCORR" },
    activities: ["agricultura", "gestión del agua", "salud pública"],
  },
  lst: {
    id: "lst",
    label: "Temperatura superficial terrestre",
    shortLabel: "LST",
    unit: "°C",
    range: [-40, 45],
    palette: THERMAL_PALETTE,
    domain: "land",
    source: "NASA MODIS (Terra)",
    resolution: "1 km · diaria",
    layer: { provider: "gibs", productId: "MODIS_Terra_Land_Surface_Temp_Day" },
    series: { provider: "power", parameter: "TS" }, // POWER TS = temperatura de piel (MERRA-2, estimación)
    activities: ["agricultura"],
  },
  sst: {
    id: "sst",
    label: "Temperatura superficial del mar",
    shortLabel: "SST",
    unit: "°C",
    range: [-2, 32],
    palette: THERMAL_PALETTE,
    domain: "ocean",
    source: "NASA GHRSST MUR (L4)",
    resolution: "1 km · diaria",
    layer: { provider: "gibs", productId: "GHRSST_L4_MUR_Sea_Surface_Temperature" },
    series: { provider: null, parameter: null }, // pendiente: definir fuente de series oceánicas
    activities: ["pesca"],
  },
});

export const VARIABLE_ORDER = Object.freeze(["precip", "lst", "sst"]);

// Variable principal del dipolo: la precipitación separa el polo húmedo del seco
export const DEFAULT_VARIABLE_ID = VARIABLES.precip.id;

export function getVariable(variableId) {
  return VARIABLES[variableId] ?? null;
}
