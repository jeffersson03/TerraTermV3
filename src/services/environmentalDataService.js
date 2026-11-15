import { ENV } from "@/config/env";
import { getVariable } from "@/constants/variables";
import { getMockTimeSeries } from "@/services/mocks/mockTimeSeries";
import { getPowerTimeSeries } from "@/services/nasa/powerTimeSeries";

// Punto de entrada ÚNICO para datos ambientales. Los hooks llaman aquí y no
// saben si la respuesta viene de un mock o de una API real.
//
// Cada variable declara su proveedor en constants/variables.js (`series.provider`).
// Proveedor nuevo = registrarlo aquí con la misma firma. Ningún componente cambia.
// Mocks solo si VITE_USE_MOCKS=true o si la variable aún no tiene proveedor real.
const SERIES_PROVIDERS = {
  power: getPowerTimeSeries,
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

  return provider({ ...query, variable });
}
