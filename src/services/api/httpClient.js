// Cliente HTTP común. Ningún componente llama a fetch directamente:
// componente → hook → servicio → httpClient.
//
// Incluye: timeout, reintentos (solo errores de red y 5xx/429), errores
// normalizados (HttpError) y caché en memoria con tiempo de vida.

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 500;

const responseCache = new Map(); // url → { expiresAt, data }

// Error único para toda la app. `code` permite decidir el mensaje en la UI.
export class HttpError extends Error {
  constructor(message, { status = null, code = "HTTP_ERROR", url = "", cause } = {}) {
    super(message, { cause });
    this.name = "HttpError";
    this.status = status;
    this.code = code; // 'TIMEOUT' | 'NETWORK' | 'HTTP_ERROR' | 'PARSE_ERROR' | 'ABORTED'
    this.url = url;
  }
}

function buildUrl(url, params) {
  if (!params) return url;
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
  return `${url}${url.includes("?") ? "&" : "?"}${query}`;
}

function isRetryable(error) {
  return error.code === "NETWORK" || error.code === "TIMEOUT" || error.status === 429 || error.status >= 500;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Una sola petición con timeout. Respeta el `signal` externo (cancelación).
async function requestOnce(url, { timeoutMs, signal, ...init }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("timeout"), timeoutMs);
  const abortFromOutside = () => controller.abort("aborted");
  signal?.addEventListener("abort", abortFromOutside, { once: true });

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      throw new HttpError(`La petición falló (${response.status})`, { status: response.status, url });
    }
    try {
      return await response.json();
    } catch (cause) {
      throw new HttpError("Respuesta con formato inválido", { code: "PARSE_ERROR", url, cause });
    }
  } catch (error) {
    if (error instanceof HttpError) throw error;
    if (controller.signal.aborted) {
      const code = controller.signal.reason === "timeout" ? "TIMEOUT" : "ABORTED";
      throw new HttpError(code === "TIMEOUT" ? "Tiempo de espera agotado" : "Petición cancelada", { code, url });
    }
    throw new HttpError("No se pudo conectar con el servidor", { code: "NETWORK", url, cause: error });
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abortFromOutside);
  }
}

/**
 * GET JSON con reintentos y caché.
 * @param {string} url
 * @param {object} [options]
 * @param {object} [options.params]     query string
 * @param {number} [options.cacheTtlMs] 0 = sin caché
 * @param {number} [options.retries]
 * @param {number} [options.timeoutMs]
 * @param {AbortSignal} [options.signal]
 */
export async function getJson(url, { params, cacheTtlMs = 0, retries = DEFAULT_RETRIES, timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = {}) {
  const fullUrl = buildUrl(url, params);

  const cached = responseCache.get(fullUrl);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  for (let attempt = 0; ; attempt++) {
    try {
      const data = await requestOnce(fullUrl, { method: "GET", timeoutMs, ...init });
      if (cacheTtlMs > 0) responseCache.set(fullUrl, { data, expiresAt: Date.now() + cacheTtlMs });
      return data;
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) throw error;
      await wait(RETRY_BASE_DELAY_MS * 2 ** attempt); // 500 ms, 1 s, 2 s…
    }
  }
}

// POST JSON (sin caché ni reintentos: puede no ser idempotente).
export function postJson(url, body, { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = {}) {
  return requestOnce(url, {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...init.headers },
    body: JSON.stringify(body),
    timeoutMs,
  });
}

export function clearHttpCache() {
  responseCache.clear();
}
