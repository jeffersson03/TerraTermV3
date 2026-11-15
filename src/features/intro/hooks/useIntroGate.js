import { useCallback, useEffect, useState } from "react";
import { useBootStore } from "@/stores/useBootStore";
import { INTRO_CONFIG } from "@/features/intro/constants/introConfig";

function wasSeenThisSession() {
  if (!INTRO_CONFIG.oncePerSession) return false;
  try {
    return sessionStorage.getItem(INTRO_CONFIG.storageKey) === "1";
  } catch {
    return false; // modo privado / almacenamiento bloqueado: se muestra igual
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(INTRO_CONFIG.storageKey, "1");
  } catch {
    // sin almacenamiento: no pasa nada, la intro se verá de nuevo al recargar
  }
}

/**
 * Decide cuándo la intro puede irse:
 *   (video/logo terminado Y globo listo) O «Saltar» O tope de tiempo (maxWaitMs).
 * Devuelve { isVisible, isLeaving, isWaitingForApp, canSkip, finishMedia, skip, complete }.
 */
export function useIntroGate() {
  const isGlobeReady = useBootStore((state) => state.isGlobeReady);
  const [isVisible, setVisible] = useState(() => !wasSeenThisSession());
  const [mediaDone, setMediaDone] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [canSkip, setCanSkip] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    const maxTimer = setTimeout(() => setTimedOut(true), INTRO_CONFIG.maxWaitMs);
    const skipTimer = setTimeout(() => setCanSkip(true), INTRO_CONFIG.skipAfterMs);
    return () => {
      clearTimeout(maxTimer);
      clearTimeout(skipTimer);
    };
  }, [isVisible]);

  const finishMedia = useCallback(() => setMediaDone(true), []);
  const skip = useCallback(() => setSkipped(true), []);

  // Al terminar la transición de salida: se desmonta y no vuelve en esta sesión
  const complete = useCallback(() => {
    markSeen();
    setVisible(false);
  }, []);

  const isLeaving = skipped || timedOut || (mediaDone && isGlobeReady);

  return {
    isVisible,
    isLeaving,
    isWaitingForApp: mediaDone && !isGlobeReady && !isLeaving,
    canSkip: canSkip && !isLeaving,
    finishMedia,
    skip,
    complete,
  };
}
