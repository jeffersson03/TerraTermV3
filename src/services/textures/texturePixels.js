// Acceso a los píxeles de las texturas equirectangulares (lon −180..180,
// lat 90..−90). Lo usan el mapa 2D (ráster) y la sonda de hover (valor bajo
// el cursor). Las imágenes se descargan una sola vez.

const imageCache = new Map(); // url → Promise<HTMLImageElement>
const pixelCache = new Map(); // url → ImageData (imagen completa)

export function loadImage(url) {
  if (!imageCache.has(url)) {
    imageCache.set(
      url,
      new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => {
          imageCache.delete(url);
          reject(new Error(`No se pudo cargar ${url}`));
        };
        image.src = url;
      })
    );
  }
  return imageCache.get(url);
}

// Píxeles completos de una textura (para muestreo puntual)
export async function loadTexturePixels(url) {
  if (pixelCache.has(url)) return pixelCache.get(url);
  const image = await loadImage(url);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  pixelCache.set(url, pixels);
  return pixels;
}

// Versión síncrona: null si aún no se cargó (llamar antes a loadTexturePixels)
export function getLoadedPixels(url) {
  return pixelCache.get(url) ?? null;
}

// Canal (0 = R, 1 = G) normalizado a 0–1 en la coordenada geográfica dada
export function sampleChannelAt(pixels, lat, lon, channel = 0) {
  const x = Math.min(pixels.width - 1, Math.max(0, Math.floor(((lon + 180) / 360) * pixels.width)));
  const y = Math.min(pixels.height - 1, Math.max(0, Math.floor(((90 - lat) / 180) * pixels.height)));
  return pixels.data[(y * pixels.width + x) * 4 + channel] / 255;
}
