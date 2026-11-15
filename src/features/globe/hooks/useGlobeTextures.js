import { useState, useEffect, useMemo } from "react";
import * as THREE from "three";

import { TEXTURE_PATHS } from "@/constants/textures";

function createFallbackTexture(r, g, b, isSRGB = false) {
  const data = new Uint8Array([r, g, b, 255]);
  const tex = new THREE.DataTexture(data, 1, 1, THREE.RGBAFormat);
  tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

export function useGlobeTextures() {
  const fallbacks = useMemo(
    () => ({
      classic: createFallbackTexture(11, 19, 34, true), // --color-space-900
      mask: createFallbackTexture(128, 128, 0, false),
      terra: createFallbackTexture(128, 128, 128, false),
      aqua: createFallbackTexture(140, 140, 140, false),
    }),
    []
  );

  const [textures, setTextures] = useState(fallbacks);

  useEffect(() => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();
    // Texturas cargadas por ESTE efecto, para liberar su memoria de GPU al desmontar
    const loadedTextures = [];
    const disposeLoaded = () => loadedTextures.forEach((tex) => tex.dispose());

    const loadSingle = (key, url, isSRGB) =>
      new Promise((resolve) => {
        loader.load(
          url,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.colorSpace = isSRGB ? THREE.SRGBColorSpace : THREE.NoColorSpace;
            tex.anisotropy = 4;
            tex.needsUpdate = true;
            loadedTextures.push(tex);
            resolve([key, tex]);
          },
          undefined,
          (err) => {
            console.warn(`[TerraTerm] Fallback activo para ${url}:`, err);
            resolve([key, fallbacks[key]]);
          }
        );
      });

    Promise.all([
      loadSingle("classic", TEXTURE_PATHS.classic, true),
      loadSingle("mask", TEXTURE_PATHS.mask, false),
      loadSingle("terra", TEXTURE_PATHS.terra, false),
      loadSingle("aqua", TEXTURE_PATHS.aqua, false),
    ]).then((entries) => {
      if (isMounted) setTextures(Object.fromEntries(entries));
      else disposeLoaded(); // terminaron de cargar después de desmontar
    });

    return () => {
      isMounted = false;
      disposeLoaded();
    };
  }, [fallbacks]);

  return textures;
}