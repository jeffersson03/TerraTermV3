import { useMemo } from 'react'
import { buildGraticulePositions } from '@/features/globe/utils/geoMath'

// Retícula de latitud/longitud sobre el globo (estilo HUD).
function GlobeGraticule({ radius, stepDeg, color }) {
  const positions = useMemo(() => buildGraticulePositions(radius, stepDeg), [radius, stepDeg])

  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.18} />
    </lineSegments>
  )
}

export default GlobeGraticule
