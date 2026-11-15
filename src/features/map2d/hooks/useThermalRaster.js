import { useEffect, useState } from "react";
import { TEXTURE_PATHS, VARIABLE_TEXTURES } from "@/constants/textures";
import { getVariable } from "@/constants/variables";
import { samplePalette } from "@/utils/colorScale";
import { loadImage } from "@/services/textures/texturePixels";

// Colores de zonas sin dato (tokens --color-space-950 / --color-space-900)
const SPACE_950 = [6, 11, 20];
const SPACE_900 = [11, 19, 34];

// Recorta el bbox de una imagen equirectangular (lon −180..180, lat 90..−90)
function cropPixels(image, [west, south, east, north]) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const x0 = Math.floor(((west + 180) / 360) * width);
  const x1 = Math.ceil(((east + 180) / 360) * width);
  const y0 = Math.floor(((90 - north) / 180) * height);
  const y1 = Math.ceil(((90 - south) / 180) * height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, x1 - x0);
  canvas.height = Math.max(1, y1 - y0);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, x0, y0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

// Valor del canal R (0–1) en la posición relativa (u, v) de un recorte
function sampleRed(pixels, u, v) {
  const x = Math.min(pixels.width - 1, Math.floor(u * pixels.width));
  const y = Math.min(pixels.height - 1, Math.floor(v * pixels.height));
  return pixels.data[(y * pixels.width + x) * 4] / 255;
}

function mix(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

// Pinta el recorte según las reglas `map2d` de la vista (qué colorea tierra y mar)
async function composeRaster(viewBbox, map2d) {
  const layers = { land: map2d.land, ocean: map2d.ocean };
  const urls = [TEXTURE_PATHS.mask, ...Object.values(layers).filter(Boolean).map((id) => VARIABLE_TEXTURES[id])];
  const images = await Promise.all(urls.map(loadImage));
  const [mask, ...thermal] = images.map((image) => cropPixels(image, viewBbox));
  const textureByLayer = {};
  Object.entries(layers).filter(([, id]) => id).forEach(([kind], index) => {
    textureByLayer[kind] = thermal[index];
  });

  const output = new ImageData(mask.width, mask.height);
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const offset = (y * mask.width + x) * 4;
      const isLand = mask.data[offset] > 127;
      const relief = mask.data[offset + 1] / 255;
      const kind = isLand ? "land" : "ocean";
      const variableId = layers[kind];

      const color = variableId
        ? samplePalette(getVariable(variableId).palette, sampleRed(textureByLayer[kind], x / mask.width, y / mask.height))
        : isLand
          ? mix(SPACE_950, SPACE_900, 0.45 + relief * 0.55) // tierra sin dato: relieve oscuro
          : mix(SPACE_950, SPACE_900, relief * 0.4); // mar sin dato: batimetría tenue

      output.data.set([color[0], color[1], color[2], 255], offset);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = output.width;
  canvas.height = output.height;
  canvas.getContext("2d").putImageData(output, 0, 0);
  return canvas;
}

/**
 * Ráster térmico del área visible, coloreado con la paleta de cada variable.
 * Devuelve un <canvas> en memoria (resolución nativa de la textura) que
 * ThermalRasterLayer escala a pantalla.
 */
export function useThermalRaster({ viewBbox, map2d }) {
  const key = viewBbox ? `${viewBbox.join(",")}|${map2d.land}|${map2d.ocean}` : null;
  const [result, setResult] = useState({ key: null, canvas: null, error: null });

  useEffect(() => {
    if (!key) return;
    let isCurrent = true;
    composeRaster(viewBbox, map2d)
      .then((canvas) => isCurrent && setResult({ key, canvas, error: null }))
      .catch((error) => isCurrent && setResult({ key, canvas: null, error }));
    return () => {
      isCurrent = false;
    };
    // viewBbox (memo de useCountryRegions) y map2d (registro congelado) son estables
  }, [key, viewBbox, map2d]);

  const isCurrent = result.key === key;
  return { canvas: isCurrent ? result.canvas : null, isLoading: Boolean(key) && !isCurrent, error: isCurrent ? result.error : null };
}
