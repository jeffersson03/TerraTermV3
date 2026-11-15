import { useCallback, useEffect, useState } from "react";
import { getTimeSeries } from "@/services/environmentalDataService";

const DEFAULT_STALE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 h

/**
 * Serie temporal de una variable para una ubicación y periodo.
 * Contrato común de los hooks de datos:
 *   { data, meta, isLoading, error, isEmpty, isStale, retry }
 * Pasa `location = null` para no consultar nada (p. ej. sin ubicación seleccionada).
 */
export function useEnvironmentalData({ variableId, location, period, staleAfterMs = DEFAULT_STALE_AFTER_MS }) {
  const lat = location?.lat;
  const lon = location?.lon;
  const { start, end } = period;
  const hasQuery = Boolean(variableId) && lat != null && lon != null;

  const [attempt, setAttempt] = useState(0);
  const requestKey = `${variableId}|${lat}|${lon}|${start}|${end}|${attempt}`;
  const [result, setResult] = useState({ key: null, response: null, error: null, isStale: false });

  useEffect(() => {
    if (!hasQuery) return;
    const controller = new AbortController();
    let staleTimer = null;

    getTimeSeries({ variableId, location: { lat, lon }, period: { start, end }, signal: controller.signal })
      .then((response) => {
        setResult({ key: requestKey, response, error: null, isStale: false });
        // Marca los datos como desactualizados pasado el tiempo configurado
        staleTimer = setTimeout(() => setResult((prev) => ({ ...prev, isStale: true })), staleAfterMs);
      })
      .catch((error) => {
        if (controller.signal.aborted) return; // cambió la consulta: se ignora
        setResult({ key: requestKey, response: null, error, isStale: false });
      });

    return () => {
      controller.abort();
      clearTimeout(staleTimer);
    };
  }, [hasQuery, requestKey, variableId, lat, lon, start, end, staleAfterMs]);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  const isCurrent = result.key === requestKey;
  const response = isCurrent ? result.response : null;
  const error = isCurrent ? result.error : null;

  return {
    data: response?.data ?? null,
    meta: response?.meta ?? null,
    isLoading: hasQuery && !isCurrent,
    error,
    isEmpty: isCurrent && !error && (response?.data?.length ?? 0) === 0,
    isStale: isCurrent && result.isStale,
    retry,
  };
}
