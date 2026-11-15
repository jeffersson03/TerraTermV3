import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Quaternion, Vector3 } from "three";
import { getSensor } from "@/constants/sensors";
import { buildBboxOutlinePositions, latLonToCartesian } from "@/features/globe/utils/geoMath";

const Z_AXIS = new Vector3(0, 0, 1);
const toCamera = new Vector3();

// Marcador de una región sobre el globo: celda (bbox), anillo con pulso y
// etiqueta "A · Piura". Usa el color de la vista asociada a la región.
// La etiqueta se oculta cuando la región queda detrás del planeta.
function RegionMarker({ region, radius }) {
  const accent = getSensor(region.sensorId).accent;
  const pulseRef = useRef(null);
  const labelRef = useRef(null);

  const { position, normal, quaternion, outline } = useMemo(() => {
    const point = new Vector3(...latLonToCartesian(region.center.lat, region.center.lon, radius * 1.004));
    const surfaceNormal = point.clone().normalize();
    return {
      position: point,
      normal: surfaceNormal,
      quaternion: new Quaternion().setFromUnitVectors(Z_AXIS, surfaceNormal),
      outline: buildBboxOutlinePositions(region.bbox, radius * 1.004),
    };
  }, [region, radius]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    if (pulseRef.current) {
      const phase = (time % 2) / 2; // 0 → 1 cada 2 s
      pulseRef.current.scale.setScalar(1 + phase * 2.5);
      pulseRef.current.material.opacity = 0.7 * (1 - phase);
    }
    if (labelRef.current) {
      toCamera.copy(state.camera.position).sub(position).normalize();
      labelRef.current.style.opacity = normal.dot(toCamera) > 0.15 ? "1" : "0";
    }
  });

  return (
    <group>
      {/* Celda: área que representa la serie */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outline, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={accent} transparent opacity={0.9} toneMapped={false} depthWrite={false} />
      </lineSegments>

      <group position={position} quaternion={quaternion}>
        <mesh>
          <circleGeometry args={[0.006, 24]} />
          <meshBasicMaterial color={accent} toneMapped={false} />
        </mesh>
        <mesh ref={pulseRef}>
          <ringGeometry args={[0.009, 0.011, 48]} />
          <meshBasicMaterial color={accent} transparent toneMapped={false} depthWrite={false} />
        </mesh>
      </group>

      <Html position={position} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
        <div
          ref={labelRef}
          data-sensor={region.sensorId}
          className="translate-x-1/2 -translate-y-6 whitespace-nowrap rounded-full border border-sensor-accent/60 bg-space-950/85 px-2.5 py-0.5 text-xs text-sensor-accent transition-opacity duration-300"
        >
          <span className="font-mono">{region.marker}</span> · {region.label}
        </div>
      </Html>
    </group>
  );
}

export default RegionMarker;
