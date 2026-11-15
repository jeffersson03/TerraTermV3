import { ENV } from "@/config/env";
import { getVariable } from "@/constants/variables";
import { getMockTimeSeries } from "@/services/mocks/mockTimeSeries";

// Punto de entrada ÚNICO para datos ambientales. Los hooks llaman aquí y no
// saben si la respuesta viene de un mock o de una API real.
//
// Fase 2: cuando exista services/nasa/powerService.js (u otro proveedor), se
// registra en SERIES_PROVIDERS con la misma firma y se desactivan los mocks
// con VITE_USE_MOCKS=false. Ningún componente cambia.
const SERIES_PROVIDERS = {
  // power: getPowerTimeSeries,
};

/**
 * Serie temporal de una variable en un punto y periodo.
 * @param {{ variableId: string, location: {lat:number, lon:number}, period: {start:string, end:string}, signal?: AbortSignal }} query
 * @returns {Promise<{ data: Array<{date:string, value:number}>, meta: object }>}
 */
export function getTimeSeries(query) {
  const variable = getVariable(query.variableId);
  if (!variable) return Promise.reject(new Error(`Variable desconocida: ${query.variableId}`));

  const provider = SERIES_PROVIDERS[variable.series.provider];
  if (ENV.useMocks || !provider) return getMockTimeSeries(query);

  return provider(query);
}
