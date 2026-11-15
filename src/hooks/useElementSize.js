import { useEffect, useState } from "react";

// Tamaño (px) de un elemento, actualizado con ResizeObserver.
// Uso: const [node, setNode] = useState(null); const size = useElementSize(node); <div ref={setNode}>
export function useElementSize(element) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return size;
}
