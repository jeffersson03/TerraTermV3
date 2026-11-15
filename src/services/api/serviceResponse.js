// Formato ÚNICO que devuelven todos los servicios de datos. Así el dashboard,
// los gráficos y el asistente no dependen de qué API respondió.
//
// {
//   data: [...],
//   meta: {
//     variableId, source, unit, resolution,
//     period: { start, end },
//     kind,       // tipo de dato (src/constants/dataKinds.js)
//     fetchedAt,  // ISO; para saber si está desactualizado
//     notes,      // limitaciones visibles al usuario (opcional)
//   }
// }

const REQUIRED_META = ["variableId", "source", "unit", "period", "kind"];

export function createServiceResponse(data, meta) {
  const missing = REQUIRED_META.filter((key) => meta?.[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`[serviceResponse] Faltan campos en meta: ${missing.join(", ")}`);
  }
  return { data, meta: { resolution: null, notes: null, fetchedAt: new Date().toISOString(), ...meta } };
}

// ¿Los datos tienen más antigüedad que `maxAgeMs`?
export function isResponseStale(meta, maxAgeMs) {
  if (!meta?.fetchedAt) return false;
  return Date.now() - new Date(meta.fetchedAt).getTime() > maxAgeMs;
}
