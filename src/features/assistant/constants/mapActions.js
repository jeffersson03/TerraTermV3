// Acciones que el asistente puede pedir al mapa. El asistente NO toca
// componentes: devuelve una lista de acciones y un dispatcher (M5,
// features/assistant/utils/dispatchMapActions.js) las traduce a los stores.
//
// { type: 'SET_LOCATION', payload: { lat, lon, label } }  → useMapStore.setLocation
// { type: 'SET_VARIABLE', payload: { variableId } }       → useFiltersStore.setVariable
// { type: 'SET_PERIOD',   payload: { start, end } }       → useFiltersStore.setPeriod
// { type: 'SET_DOMAIN',   payload: { domain } }           → useTelemetryStore.setDomain
export const MAP_ACTION_TYPES = Object.freeze({
  SET_LOCATION: "SET_LOCATION",
  SET_VARIABLE: "SET_VARIABLE",
  SET_PERIOD: "SET_PERIOD",
  SET_DOMAIN: "SET_DOMAIN",
});
