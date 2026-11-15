import { useCallback, useSyncExternalStore } from "react";

// true si la media query coincide. Ej.: useMediaQuery("(min-width: 1024px)")
// (1024px = breakpoint `lg` de Tailwind)
export function useMediaQuery(query) {
  const subscribe = useCallback(
    (onChange) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query]
  );

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}
