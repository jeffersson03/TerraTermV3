import HudButton from "@/components/Hud/HudButton";

const ERROR_MESSAGES = {
  TIMEOUT: "El servidor tardó demasiado en responder.",
  NETWORK: "No se pudo conectar. Revisa tu conexión.",
  PARSE_ERROR: "La respuesta del servidor no es válida.",
};

function getErrorMessage(error) {
  return ERROR_MESSAGES[error?.code] ?? "No se pudieron cargar los datos.";
}

// Envuelve cualquier bloque de datos y resuelve los 4 estados obligatorios
// (CLAUDE.md): carga, error, sin datos y desactualizado. Úsalo con el
// resultado de un hook de datos: <DataState {...useEnvironmentalData(...)}>.
function DataState({ isLoading, error, isEmpty, isStale, retry, emptyMessage, children }) {
  if (isLoading) {
    return (
      <div role="status" className="flex items-center gap-2 py-4 font-mono text-xs text-ink-muted">
        <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-sensor-accent" />
        Cargando datos…
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 py-4 text-xs text-ink-secondary">
        <p>{getErrorMessage(error)}</p>
        {retry && <HudButton onClick={retry}>Reintentar</HudButton>}
      </div>
    );
  }

  if (isEmpty) {
    return <p className="py-4 text-xs text-ink-muted">{emptyMessage ?? "No hay datos para esta selección."}</p>;
  }

  return (
    <>
      {isStale && (
        <p role="status" className="mb-2 rounded-sm border border-hud-border px-2 py-1 text-[11px] text-ink-secondary">
          Estos datos pueden estar desactualizados.
          {retry && (
            <button type="button" onClick={retry} className="ml-1 text-sensor-accent underline underline-offset-2">
              Actualizar
            </button>
          )}
        </p>
      )}
      {children}
    </>
  );
}

export default DataState;
