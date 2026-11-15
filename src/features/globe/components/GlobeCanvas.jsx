import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import EarthGlobe from "@/features/globe/components/EarthGlobe";
import CameraRig from "@/features/globe/components/CameraRig";
import RegionMarkers from "@/features/globe/components/RegionMarkers";
import { GLOBE_CONFIG } from "@/features/globe/constants/globeConfig";
import { useHoverStore } from "@/stores/useHoverStore";
import { useTelemetryStore } from "@/stores/useTelemetryStore";

// Escena 3D: cámara, luces, fondo estelar, globo y controles orbitales.
// Los controles HUD (selector de vista, leyenda, coordenadas) viven fuera,
// en ExplorerPage, porque los comparten el globo y el mapa 2D.
//
// Props:
//   isActive        → false = globo oculto: deja de renderizar (frameloop "never")
//   onCountryClick  → (feature) clic en un país
function GlobeCanvas({ isActive = true, onCountryClick }) {
  const { camera, controls, colors } = GLOBE_CONFIG;
  const domain = useTelemetryStore((state) => state.domain);
  // Solo las acciones (estables): GlobeCanvas NO se re-renderiza al mover el ratón
  const setHoveredLocation = useHoverStore((state) => state.setHoveredLocation);
  const clearHover = useHoverStore((state) => state.clearHover);

  return (
    <Canvas camera={camera} dpr={[1, 2]} frameloop={isActive ? "always" : "never"} className="h-full w-full">
      <color attach="background" args={[colors.space]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={1} />

      <Suspense fallback={null}>
        <Stars radius={100} depth={50} count={4000} factor={4} fade speed={0.5} />

        <EarthGlobe
          domain={domain}
          onHoverLocation={setHoveredLocation}
          onHoverEnd={clearHover}
          onCountryClick={onCountryClick}
        >
          {/* Regiones resaltadas (useMapStore.highlightedRegionIds) */}
          <RegionMarkers radius={GLOBE_CONFIG.radius} />
        </EarthGlobe>
      </Suspense>

      {/* Vuelo de cámara hacia useMapStore.cameraTarget */}
      <CameraRig />

      <OrbitControls
        makeDefault
        enablePan={false}
        enableDamping
        autoRotate={controls.autoRotate}
        autoRotateSpeed={controls.autoRotateSpeed}
        minDistance={controls.minDistance}
        maxDistance={controls.maxDistance}
      />
    </Canvas>
  );
}

export default GlobeCanvas;
