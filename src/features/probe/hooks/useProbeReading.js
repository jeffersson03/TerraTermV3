import { useEffect, useState } from "react";
import { TEXTURE_PATHS, VARIABLE_TEXTURES } from "@/constants/textures";
import { getVariable } from "@/constants/variables";
import { getLoadedPixels, loadTexturePixels, sampleChannelAt } from "@/services/textures/texturePixels";
import { samplePalette } from "@/utils/colorScale";

const PROBE_TEXTURES = [TEXTURE_PATHS.mask, ...Object.values(VARIABLE_TEXTURES)];

// Precarga los píxeles de máscara y texturas térmicas; re-renderiza al terminar
function useProbeTexturesReady() {
  const [isReady, setIsReady] = useState(() => PROBE_TEXTURES.every((url) => getLoadedPixels(url)));

  useEffect(() => {
    if (isReady) return;
    let isMounted = true;
    Promise.all(PROBE_TEXTURES.map(loadTexturePixels))
      .then(() => isMounted && setIsReady(true))
      .catch(() => {}); // sin texturas la sonda muestra solo nombre y coordenadas
    return () => {
      isMounted = false;
    };
  }, [isReady]);

  return isReady;
}

/**
 * Lectura bajo el cursor según la vista activa (reglas `sensor.map2d`):
 * superficie (tierra/mar) y, si la vista la colorea, valor de la variable.
 * @returns {{ surface: 'land'|'ocean', variable, value, color } | null}
 */
export function useProbeReading(location, sensor) {
  const isReady = useProbeTexturesReady();
  if (!location || !isReady) return null;

  const { lat, lon } = location;
  const isLand = sampleChannelAt(getLoadedPixels(TEXTURE_PATHS.mask), lat, lon) > 0.5;
  const surface = isLand ? "land" : "ocean";
  const variable = getVariable(sensor.map2d[surface]);
  if (!variable) return { surface, variable: null, value: null, color: null };

  const t = sampleChannelAt(getLoadedPixels(VARIABLE_TEXTURES[variable.id]), lat, lon);
  const [min, max] = variable.range;
  const [r, g, b] = samplePalette(variable.palette, t);
  return { surface, variable, value: min + t * (max - min), color: `rgb(${r}, ${g}, ${b})` };
}
