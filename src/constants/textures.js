// Rutas de las texturas equirectangulares (públicas). Las usan el globo 3D
// (useGlobeTextures) y el mapa 2D (useThermalRaster).
export const TEXTURE_PATHS = Object.freeze({
  classic: "/textures/blue-marble-4k.webp",
  mask: "/textures/land-mask-bathymetry.webp", // R: tierra/mar · G: relieve
  terra: "/textures/terra-thermal.png",
  aqua: "/textures/aqua-thermal.png",
});

// Textura escalar (0–1 en el canal R) que representa cada variable.
// 0 y 1 equivalen a range[0] y range[1] de la variable (src/constants/variables.js).
export const VARIABLE_TEXTURES = Object.freeze({
  lst: TEXTURE_PATHS.terra,
  sst: TEXTURE_PATHS.aqua,
});
