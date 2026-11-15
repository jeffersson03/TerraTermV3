import { createServiceResponse } from "@/services/api/serviceResponse";
import { getVariable } from "@/constants/variables";

const MOCK_LATENCY_MS = 400;
const DAY_MS = 86_400_000;

// Generador pseudoaleatorio con semilla: misma ubicación → misma serie
// (los gráficos no "bailan" entre renders y las demos son reproducibles).
function createSeededRandom(seed) {
  let state = Math.abs(Math.floor(seed * 1_000_003)) % 2_147_483_647 || 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
}

// Valor diario plausible: media según latitud + estacionalidad + ruido.
function simulateValue(variable, lat, date, random) {
  const [min, max] = variable.range;
  const latFactor = 1 - Math.abs(lat) / 90; // más cálido cerca del ecuador
  const mean = min + (max - min) * (0.25 + 0.5 * latFactor);
  const dayOfYear = (date - new Date(date.getFullYear(), 0, 0)) / DAY_MS;
  const hemisphere = lat >= 0 ? 1 : -1; // estaciones invertidas en el sur
  const seasonal = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI) * hemisphere * (max - min) * 0.12;
  const noise = (random() - 0.5) * (max - min) * 0.04;
  const value = Math.min(max, Math.max(min, mean + seasonal + noise)); // p. ej. sin lluvia negativa
  return Math.round(value * 10) / 10;
}

/**
 * Serie temporal SIMULADA con el mismo formato que devolverán los servicios reales.
 * Marcada como kind 'prototype' para que la UI lo muestre.
 */
export async function getMockTimeSeries({ variableId, location, period, signal }) {
  const variable = getVariable(variableId);
  if (!variable) throw new Error(`[mock] Variable desconocida: ${variableId}`);

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
  if (signal?.aborted) throw new DOMException("Petición cancelada", "AbortError");

  const random = createSeededRandom(location.lat * 1000 + location.lon);
  const start = new Date(`${period.start}T00:00:00`);
  const end = new Date(`${period.end}T00:00:00`);
  const data = [];

  for (let time = start.getTime(); time <= end.getTime(); time += DAY_MS) {
    const date = new Date(time);
    data.push({ date: date.toISOString().slice(0, 10), value: simulateValue(variable, location.lat, date, random) });
  }

  return createServiceResponse(data, {
    variableId,
    source: "Datos simulados (mock)",
    unit: variable.unit,
    period,
    resolution: "diaria · punto",
    kind: "prototype",
    notes: "Serie generada para desarrollo; no representa mediciones reales.",
  });
}
