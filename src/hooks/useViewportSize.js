import { useSyncExternalStore } from "react";

function subscribe(onChange) {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
}

const getWidth = () => window.innerWidth;
const getHeight = () => window.innerHeight;

// Tamaño de la ventana (px), reactivo al redimensionar.
export function useViewportSize() {
  const width = useSyncExternalStore(subscribe, getWidth, () => 0);
  const height = useSyncExternalStore(subscribe, getHeight, () => 0);
  return { width, height };
}
