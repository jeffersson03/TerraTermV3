import { createServiceResponse } from "../api/serviceResponse.js";
import { fetchPowerMonthly, powerCell, powerCoverage } from "./powerService.js";

// Adaptador NASA POWER → contrato común de getTimeSeries ({ data, meta }).
// Una consulta por punto trae T2M, TS y PRECTOTCORR de 1981–2025; powerService la guarda en
// caché, así cambiar de variable o de periodo en la misma zona no vuelve a llamar a la API.
// Rutas relativas (no `@/`) para poder probarlo con `node --test`.

const PARAMETER_NOTES = {
  TS: "Temperatura de piel de MERRA-2 (tierra o superficie del mar según la celda). Reanálisis, no medición directa.",
  PRECTOTCORR: "Precipitación de MERRA-2 corregida con observaciones (mm/día, media mensual).",
  T2M: "Temperatura del aire a 2 m de MERRA-2.",
};

function abortError() {
  return new DOMException("Petición cancelada", "AbortError");
}

// { '2003': [12 valores] } → [{ date: '2003-01', value }] dentro del periodo pedido.
// Los meses sin dato (null) se omiten: aggregateSeries descarta los años incompletos.
export function toMonthlySeries(years, period) {
  const startYear = Number(period.start.slice(0, 4));
  const endYear = Number(period.end.slice(0, 4));
  const data = [];
  for (let year = startYear; year <= endYear; year++) {
    const months = years?.[year];
    if (!months) continue;
    months.forEach((value, index) => {
      if (Number.isFinite(value)) data.push({ date: `${year}-${String(index + 1).padStart(2, "0")}`, value });
    });
  }
  return data;
}

/**
 * Serie mensual real de NASA POWER para una variable del catálogo.
 * @param {{ variable: object, location: {lat:number, lon:number}, period: {start:string, end:string}, signal?: AbortSignal }} query
 */
export async function getPowerTimeSeries({ variable, location, period, signal, fetchImpl }) {
  if (signal?.aborted) throw abortError();
  const parameter = variable.series.parameter;
  const response = await fetchPowerMonthly({ latitude: location.lat, longitude: location.lon, fetchImpl });
  if (signal?.aborted) throw abortError();

  const cell = powerCell(location.lat, location.lon);
  const lastYear = Math.min(Number(period.end.slice(0, 4)), powerCoverage.to);

  return createServiceResponse(toMonthlySeries(response.series[parameter], period), {
    variableId: variable.id,
    source: `NASA POWER (MERRA-2) · ${parameter}`,
    unit: variable.unit,
    period: { start: period.start, end: `${lastYear}-12-31` },
    resolution: `celda 0,5° × 0,625° (~${Math.round(cell.heightKm)} × ${Math.round(cell.widthKm)} km) · mensual`,
    kind: "estimate",
    notes: PARAMETER_NOTES[parameter] ?? null,
    // Claves para mostrarlo en el idioma activo (SourceBadge); los textos de arriba son el respaldo
    resolutionKey: "source.powerResolution",
    resolutionVars: { height: Math.round(cell.heightKm), width: Math.round(cell.widthKm) },
    notesKey: PARAMETER_NOTES[parameter] ? `source.powerNotes.${parameter}` : undefined,
  });
}
