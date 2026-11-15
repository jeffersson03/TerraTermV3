// Une el estado de dos consultas de datos para un solo <DataState>:
// carga/error si cualquiera lo tiene; vacío solo si ambas están vacías.
export function combineStates(a, b) {
  return {
    isLoading: a.isLoading || b.isLoading,
    error: a.error ?? b.error,
    isEmpty: a.isEmpty && b.isEmpty,
    isStale: a.isStale || b.isStale,
    retry: () => {
      a.retry();
      b.retry();
    },
  };
}
