// Configuración de la intro de carga. Cambiar el video o los tiempos es editar este archivo.
//
// Video: colócalo en public/intro/ (se sirve tal cual). Recomendado: 3–5 s, MP4 H.264, sin audio,
// ≤ 2 MB, 1920×1080 (horizontal). Opcional: una versión vertical 1080×1920 para móviles.
// Si el archivo no existe o el navegador no puede reproducirlo, se muestra el logo animado.
export const INTRO_CONFIG = Object.freeze({
  video: {
    landscape: "/intro/terraterm-intro.mp4",
    portrait: null, // p. ej. "/intro/terraterm-intro-vertical.mp4"
    poster: null, // p. ej. "/intro/terraterm-intro-poster.webp" (primer fotograma, carga al instante)
  },
  fallbackDurationMs: 2800, // duración del logo animado cuando no hay video
  videoStartTimeoutMs: 2500, // si el video no empieza en este tiempo, se usa el logo
  maxWaitMs: 10000, // tope total: la intro nunca bloquea más que esto
  skipAfterMs: 800, // cuándo aparece el botón «Saltar»
  oncePerSession: true, // true = solo la primera vez en la pestaña (sessionStorage)
  storageKey: "terraterm:intro-vista",
  exitDurationS: 1.15, // duración de la transición de salida
});
