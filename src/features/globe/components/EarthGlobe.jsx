import { useRef, useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import GlobeGraticule from "@/features/globe/components/GlobeGraticule";
import CountryBorders from "@/features/globe/components/CountryBorders";
import { useHoverStore } from "@/stores/useHoverStore";
import { GLOBE_CONFIG } from "@/features/globe/constants/globeConfig";
import { useWorldTopology } from "@/features/globe/hooks/useWorldTopology";
import { useGlobeTextures } from "@/features/globe/hooks/useGlobeTextures";
import { cartesianToLatLon, findCountryAt } from "@/features/globe/utils/geoMath";
import { DEFAULT_SENSOR_ID, getSensor } from "@/constants/sensors";
import { THERMAL_PALETTE } from "@/constants/thermalPalette";

// Convierte "#rrggbb" a vec3 con los valores sRGB tal cual (0–1), SIN gestión de
// color de Three: el shader convierte a lineal por su cuenta (sRGBTransferEOTF).
function hexToSrgbVector(hex) {
  const value = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

const THERMAL_STOPS = THERMAL_PALETTE.map(hexToSrgbVector);

// Shaders para el Halo Atmosférico Fresnel exterior (Subpaso 4C)
const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uRimColor;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float ndotv = dot(normalize(vNormal), normalize(vViewDir));
    float intensity = pow(clamp(0.62 - ndotv, 0.0, 1.0), 3.4);
    gl_FragColor = vec4(uRimColor, intensity * 0.65);
  }
`;

// `children`: capas extra (marcadores, alertas…) que deben girar con el planeta.
// Si el puntero se movió más que esto entre pulsar y soltar, fue un arrastre (no clic)
const CLICK_MAX_DRAG_PX = 4;

function EarthGlobe({ domain = DEFAULT_SENSOR_ID, onHoverLocation, onHoverEnd, onCountryClick, children }) {
  const { radius, segments, graticuleStepDeg, colors } = GLOBE_CONFIG;
  const sensor = getSensor(domain);
  const targetMix = sensor.shaderMix;

  // Texturas equirectangulares (Blue Marble, Máscara R/G, Terra LST, Aqua SST)
  const textures = useGlobeTextures();

  // Topología mundial (1 draw call para fronteras + polígonos para hover)
  const topology = useWorldTopology(radius * 1.0015);
  // Solo la acción (estable): el país en hover lo lee CountryBorders, no EarthGlobe
  const setHoveredFeature = useHoverStore((state) => state.setHoveredFeature);
  const lastFeatureRef = useRef(null);
  const lastCheckTimeRef = useRef(0);

  // Referencias del shader y animaciones
  const shaderRef = useRef(null);
  const atmoMatRef = useRef(null);
  const currentMix = useRef(targetMix);
  const sweepProgress = useRef(0);
  const sweepActive = useRef(false);
  const previousDomain = useRef(domain);

  const activeAccentHex = sensor.accent;
  const targetAccentColor = useMemo(
    () => new THREE.Color(activeAccentHex),
    [activeAccentHex]
  );

  // Uniforms estables para el halo atmosférico Fresnel
  const atmoUniforms = useMemo(
    () => ({
      uRimColor: { value: new THREE.Color(getSensor(DEFAULT_SENSOR_ID).accent) },
    }),
    []
  );

  // Detectar cambios de dominio y disparar onda de barrido
  useEffect(() => {
    if (previousDomain.current !== domain) {
      sweepProgress.current = 0;
      sweepActive.current = true;
      previousDomain.current = domain;
    }
  }, [domain]);

  // Animaciones de Three.js
  useFrame((_, delta) => {
    const smoothFactor = 1 - Math.exp(-delta * 6);

    // Interpolar color del halo atmosférico Fresnel según el sensor activo
    if (atmoMatRef.current) {
      atmoMatRef.current.uniforms.uRimColor.value.lerp(
        targetAccentColor,
        smoothFactor
      );
    }

    const shader = shaderRef.current;
    if (!shader) return;

    // Actualizar texturas en cuanto terminen de cargar
    shader.uniforms.uClassicMap.value = textures.classic;
    shader.uniforms.uMaskMap.value = textures.mask;
    shader.uniforms.uTerraMap.value = textures.terra;
    shader.uniforms.uAquaMap.value = textures.aqua;
    shader.uniforms.uAccentColor.value.lerp(targetAccentColor, smoothFactor);

    // Interpolación suave entre Classic (0), Terra (1) y Aqua (2)
    currentMix.current += (targetMix - currentMix.current) * smoothFactor;
    shader.uniforms.uDomainMix.value = currentMix.current;

    // Scanline Sweep: 350 ms
    if (sweepActive.current) {
      sweepProgress.current += delta / 0.35;
      if (sweepProgress.current >= 1) {
        sweepProgress.current = 1;
        sweepActive.current = false;
      }
      shader.uniforms.uSweepProgress.value = sweepProgress.current;
    }
  });

  // Detección de coordenadas y país bajo el cursor
  const handlePointerMove = (event) => {
    event.stopPropagation();
    if (!topology?.countryIndex) return;

    const now = performance.now();
    if (now - lastCheckTimeRef.current < 30) return;
    lastCheckTimeRef.current = now;

    const localPoint = event.object.worldToLocal(event.point.clone());
    const { lat, lon } = cartesianToLatLon(localPoint, radius);

    const matched = findCountryAt(
      lat,
      lon,
      topology.countryIndex,
      lastFeatureRef.current
    );

    if (matched !== lastFeatureRef.current) {
      lastFeatureRef.current = matched;
      setHoveredFeature(matched);
      document.body.style.cursor = matched ? "pointer" : "grab";
    }

    // country = null sobre el océano (la sonda decide el texto)
    onHoverLocation?.({
      lat,
      lon,
      country: matched?.properties?.name ?? null,
      screenX: event.nativeEvent.clientX,
      screenY: event.nativeEvent.clientY,
    });
  };

  // Clic en un país (no en océano ni al terminar un arrastre)
  const handleClick = (event) => {
    if (event.delta > CLICK_MAX_DRAG_PX || !topology?.countryIndex) return;
    event.stopPropagation();
    const localPoint = event.object.worldToLocal(event.point.clone());
    const { lat, lon } = cartesianToLatLon(localPoint, radius);
    const country = findCountryAt(lat, lon, topology.countryIndex, lastFeatureRef.current);
    if (country) onCountryClick?.(country);
  };

  const handlePointerOut = () => {
    lastFeatureRef.current = null;
    document.body.style.cursor = "auto";
    onHoverEnd?.(); // limpia ubicación y país en useHoverStore
  };

  return (
    <group>
      {/* Superficie del planeta */}
      <mesh
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <sphereGeometry args={[radius, segments, segments]} />

        <meshStandardMaterial
          color={colors.surface}
          roughness={0.85}
          metalness={0.05}
          // Sin tone mapping (ACES por defecto en R3F): desatura y desplaza la paleta térmica
          toneMapped={false}
          onBeforeCompile={(shader) => {
            shader.uniforms.uClassicMap = { value: textures.classic };
            shader.uniforms.uMaskMap = { value: textures.mask };
            shader.uniforms.uTerraMap = { value: textures.terra };
            shader.uniforms.uAquaMap = { value: textures.aqua };
            shader.uniforms.uDomainMix = { value: currentMix.current };
            shader.uniforms.uSweepProgress = { value: 0 };
            shader.uniforms.uThermalStops = { value: THERMAL_STOPS };
            shader.uniforms.uAccentColor = {
              value: new THREE.Color(activeAccentHex),
            };

            shader.vertexShader = shader.vertexShader.replace(
              "#include <common>",
              `#include <common>
               varying float vGlobeY;
               varying vec2 vGlobeUv;`
            );

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
               vGlobeY = normalize(position).y * 0.5 + 0.5;
               vGlobeUv = uv;`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <common>",
              `#include <common>
               varying float vGlobeY;
               varying vec2 vGlobeUv;
               uniform sampler2D uClassicMap;
               uniform sampler2D uMaskMap;
               uniform sampler2D uTerraMap;
               uniform sampler2D uAquaMap;
               uniform float uDomainMix;
               uniform float uSweepProgress;
               uniform vec3 uAccentColor;
               uniform vec3 uThermalStops[5]; // THERMAL_PALETTE (sRGB), compartida con la leyenda

               // LUT térmica: 5 paradas equidistantes de src/constants/thermalPalette.js
               vec3 thermalLUT(float t) {
                 t = clamp(t, 0.0, 1.0);
                 if (t < 0.25) return mix(uThermalStops[0], uThermalStops[1], t / 0.25);
                 if (t < 0.50) return mix(uThermalStops[1], uThermalStops[2], (t - 0.25) / 0.25);
                 if (t < 0.75) return mix(uThermalStops[2], uThermalStops[3], (t - 0.50) / 0.25);
                 return mix(uThermalStops[3], uThermalStops[4], (t - 0.75) / 0.25);
               }

               // Curvas isotermas procedurales con grosor constante (fwidth)
               float computeIsotherm(float field, float steps) {
                 float scaled = field * steps;
                 float dist = abs(fract(scaled - 0.5) - 0.5);
                 float lineWidth = fwidth(scaled) * 1.15;
                 return 1.0 - smoothstep(0.0, max(lineWidth, 0.015), dist);
               }`
            );

            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <color_fragment>",
              `#include <color_fragment>

               // 1. Muestreo de las 4 texturas
               vec3 classicView = texture2D(uClassicMap, vGlobeUv).rgb;
               vec2 maskData    = texture2D(uMaskMap, vGlobeUv).rg; // R: Tierra/Mar, G: Relieve
               float terraVal   = texture2D(uTerraMap, vGlobeUv).r;
               float aquaVal    = texture2D(uAquaMap, vGlobeUv).r;

               float isLand    = smoothstep(0.35, 0.65, maskData.r);
               float relief    = maskData.g;

               // Colores base de tus tokens --color-space-950 (#060b14) y --color-space-900 (#0b1322)
               // (valores sRGB; se convierten a lineal al final del paso 3)
               vec3 space950 = vec3(0.024, 0.043, 0.078);
               vec3 space900 = vec3(0.043, 0.075, 0.133);

               // 2. Vista TERRA (LST): Continentes térmicos + isotermas, océanos radiográficos
               // Sin hillshade sobre la paleta: el color debe corresponder 1:1 con la leyenda.
               // El relieve solo se usa en las zonas sin datos (océano en Terra, tierra en Aqua).
               vec3 terraThermal = thermalLUT(terraVal);
               float terraIso    = computeIsotherm(terraVal, 14.0);
               terraThermal      = mix(terraThermal, vec3(1.0, 0.97, 0.90), terraIso * 0.24);
               vec3 oceanDark    = space950 + vec3(0.008, 0.016, 0.032) * relief;
               vec3 terraView    = mix(oceanDark, terraThermal, isLand);

               // 3. Vista AQUA (SST): Océanos térmicos + isotermas, continentes con relieve oscuro
               vec3 aquaThermal  = thermalLUT(aquaVal);
               float aquaIso     = computeIsotherm(aquaVal, 16.0);
               aquaThermal       = mix(aquaThermal, vec3(0.90, 0.98, 1.0), aquaIso * 0.26);
               vec3 landDark     = mix(space950, space900, 0.45 + relief * 0.55);
               vec3 aquaView     = mix(aquaThermal, landDark, isLand);

               // La paleta y los tokens están en sRGB (igual que el hex de la leyenda en el DOM);
               // el pipeline de Three trabaja en lineal y re-codifica a sRGB al final.
               terraView = sRGBTransferEOTF(vec4(terraView, 1.0)).rgb;
               aquaView  = sRGBTransferEOTF(vec4(aquaView, 1.0)).rgb;

               // 4. Transición fluida entre modos (0: Classic, 1: Terra, 2: Aqua)
               vec3 step1 = mix(classicView, terraView, clamp(uDomainMix, 0.0, 1.0));
               vec3 finalBase = mix(step1, aquaView, clamp(uDomainMix - 1.0, 0.0, 1.0));
               diffuseColor.rgb = finalBase;

               // 5. Onda de barrido (Scanline Sweep) teñida con el color del sensor activo
               float distanceToSweep = abs(vGlobeY - uSweepProgress);
               float sweep = 1.0 - smoothstep(0.0, 0.025, distanceToSweep);
               diffuseColor.rgb += uAccentColor * sweep * 0.75;
              `
            );

            // 6. Vistas de datos SIN iluminación: la luz direccional oscurecería
            //    zonas calientes en el lado en sombra y el color dejaría de
            //    coincidir con la leyenda. Classic (0) conserva la luz;
            //    Terra/Aqua (>= 1) muestran el color plano.
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <opaque_fragment>",
              `float unlitWeight = clamp(uDomainMix, 0.0, 1.0);
               outgoingLight = mix(outgoingLight, diffuseColor.rgb, unlitWeight);
               #include <opaque_fragment>`
            );

            shaderRef.current = shader;
          }}
        />
      </mesh>

      {/* Fronteras mundiales + Hover por país */}
      <CountryBorders
        borderPositions={topology?.borderPositions}
        domain={domain}
        radius={radius * 1.003}
      />

      {/* Retícula geográfica */}
      <GlobeGraticule
        radius={radius * 1.001}
        stepDeg={graticuleStepDeg}
        color={activeAccentHex}
      />

      {/* Halo atmosférico Fresnel exterior (reemplaza malla básica) */}
      <mesh scale={1.048}>
        <sphereGeometry args={[radius, segments, segments]} />
        <shaderMaterial
          ref={atmoMatRef}
          vertexShader={atmosphereVertexShader}
          fragmentShader={atmosphereFragmentShader}
          uniforms={atmoUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {children}
    </group>
  );
}

export default EarthGlobe;