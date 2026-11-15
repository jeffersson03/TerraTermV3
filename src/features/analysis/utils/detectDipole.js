// Detección de "dipolo": dos regiones con tendencias significativas de signo
// opuesto en la misma variable y el mismo periodo.
//
// Resultado:
//   status: 'dipole'      → ambas significativas y opuestas
//           'partial'     → opuestas, pero solo una (o ninguna) es significativa
//           'same'        → misma dirección
//           'insufficient'→ alguna serie no tiene años suficientes
export function detectDipole(trendA, trendB) {
  if (!trendA?.isReliable || !trendB?.isReliable) {
    return { status: "insufficient", label: "Datos insuficientes" };
  }

  const opposite =
    trendA.direction !== "none" && trendB.direction !== "none" && trendA.direction !== trendB.direction;

  if (!opposite) return { status: "same", label: "Sin dipolo: misma dirección" };
  if (trendA.isSignificant && trendB.isSignificant) return { status: "dipole", label: "Dipolo detectado" };
  return { status: "partial", label: "Señal opuesta no concluyente" };
}
