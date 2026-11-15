import HudButton from "@/components/Hud/HudButton";
import { useT } from "@/i18n/useT";

// Clave de i18n por código de error del cliente HTTP / servicios
const ERROR_KEYS = {
  TIMEOUT: "dataState.timeout",
  NETWORK: "dataState.network",
  PARSE_ERROR: "dataState.parse",
  timeout: "dataState.timeout", // códigos de NASA POWER (powerService)
  network: "dataState.network",
  format: "dataState.parse",
};

// Envuelve cualquier bloque de datos y resuelve los 4 estados obligatorios
// (CLAUDE.md): carga, error, sin datos y desactualizado. Úsalo con el
// resultado de un hook de datos: <DataState {...useEnvironmentalData(...)}>.
function DataState({ isLoading, error, isEmpty, isStale, retry, emptyMessage, children }) {
  const { t } = useT();

  if (isLoading) {
    return (
      <div role="status" className="flex items-center gap-2 py-4 font-mono text-xs text-ink-muted">
        <span aria-hidden="true" className="h-2 w-2 animate-pulse rounded-full bg-sensor-accent" />
        {t("dataState.loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-2 py-4 text-xs text-ink-secondary">
        <p>{t(ERROR_KEYS[error?.code] ?? "dataState.generic")}</p>
        {retry && <HudButton onClick={retry}>{t("dataState.retry")}</HudButton>}
      </div>
    );
  }

  if (isEmpty) {
    return <p className="py-4 text-xs text-ink-muted">{emptyMessage ?? t("dataState.empty")}</p>;
  }

  return (
    <>
      {isStale && (
        <p role="status" className="mb-2 rounded-sm border border-hud-border px-2 py-1 text-[11px] text-ink-secondary">
          {t("dataState.stale")}
          {retry && (
            <button type="button" onClick={retry} className="ml-1 text-sensor-accent underline underline-offset-2">
              {t("dataState.refresh")}
            </button>
          )}
        </p>
      )}
      {children}
    </>
  );
}

export default DataState;
