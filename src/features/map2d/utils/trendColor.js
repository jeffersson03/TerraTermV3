import { TREND_PALETTE, TREND_RANGE_C_PER_DECADE } from "@/constants/palettes";
import { samplePalette } from "@/utils/colorScale";

// Opacidad según la solidez de la tendencia: así el color fuerte solo aparece donde hay evidencia.
export const TREND_OPACITY = Object.freeze({
  significant: 0.85, // p < 0,05 con ≥ 10 años
  notSignificant: 0.4,
  unreliable: 0.2, // menos de 10 años: no se concluye nada
});

// Color de una pendiente (°C/década) en la escala divergente.
export function trendColor(slopePerDecade) {
  const [min, max] = TREND_RANGE_C_PER_DECADE;
  const [r, g, b] = samplePalette(TREND_PALETTE, (slopePerDecade - min) / (max - min));
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}

export function trendOpacity(trend) {
  if (!trend?.isReliable) return TREND_OPACITY.unreliable;
  return trend.isSignificant ? TREND_OPACITY.significant : TREND_OPACITY.notSignificant;
}
