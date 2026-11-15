import { useMemo } from "react";
import { buildFeatureOutlinePositions } from "@/features/globe/utils/geoMath";
import { DEFAULT_SENSOR_ID, getSensor } from "@/constants/sensors";
import { useHoverStore } from "@/stores/useHoverStore";

// Fronteras mundiales (1 draw call) + contorno del país bajo el cursor (1 draw call).
// Se suscribe él mismo al país en hover: así EarthGlobe no se re-renderiza al
// pasar de un país a otro.
function CountryBorders({ borderPositions, domain = DEFAULT_SENSOR_ID, radius = 1.003 }) {
  const style = getSensor(domain).borders;
  const hoveredFeature = useHoverStore((state) => state.hoveredFeature);

  const hoverPositions = useMemo(
    () => (hoveredFeature ? buildFeatureOutlinePositions(hoveredFeature, radius) : null),
    [hoveredFeature, radius]
  );

  if (!borderPositions) return null;

  return (
    <group>
      {/* Capa 1: todas las fronteras del mundo */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[borderPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={style.baseColor}
          transparent
          opacity={style.baseOpacity}
          depthWrite={false}
        />
      </lineSegments>

      {/* Capa 2: país resaltado en hover */}
      {hoverPositions && hoverPositions.length > 0 && (
        <lineSegments key={hoveredFeature.id || hoveredFeature.properties?.name}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[hoverPositions, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={style.hoverColor} toneMapped={false} depthWrite={false} />
        </lineSegments>
      )}
    </group>
  );
}

export default CountryBorders;
