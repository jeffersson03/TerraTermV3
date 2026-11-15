// Configuración visual del globo. Los colores replican los tokens de src/styles/theme.css
// porque Three.js necesita valores hex, no clases de Tailwind.
// Los colores que dependen de la vista (acentos, fronteras) están en src/constants/sensors.js.
export const GLOBE_CONFIG = Object.freeze({
  radius: 1,
  segments: 64,
  graticuleStepDeg: 15,
  colors: {
    space: '#060b14', // --color-space-950
    surface: '#0b1322', // --color-space-900
  },
  camera: { position: [0, 0, 3.2], fov: 45 },
  // minDistance 1.25: permite el acercamiento del paso "Ciudad" (distancia 1.35)
  controls: { autoRotate: false, autoRotateSpeed: 0.3, minDistance: 1.25, maxDistance: 6 },
})
