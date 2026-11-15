import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

// Emblema animado de la vista activa (SVG 64×64, color = acento de la vista).
// Un bisel de radar común + un motivo distinto por vista:
//   classic → globo con meridianos que giran (lo global)
//   terra   → isotermas que laten (calor sobre tierra)
//   aqua    → olas que avanzan + pulso de sonar (océano)
// Al cambiar de vista el motivo sale y entra con giro y escala.

const MOTIF_TRANSITION = { duration: 0.4, ease: [0.22, 1, 0.36, 1] };

function GlobalMotif({ animate }) {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <circle cx="32" cy="32" r="16" />
      <line x1="16" y1="32" x2="48" y2="32" opacity="0.6" />
      {[0, 1, 2].map((index) => (
        <motion.ellipse
          key={index}
          cx="32"
          cy="32"
          ry="16"
          opacity={0.75}
          initial={{ rx: 16 - index * 6 }}
          animate={animate ? { rx: [16, 1, 16] } : undefined}
          transition={{ duration: 6, repeat: Infinity, ease: "linear", delay: index * 2 }}
        />
      ))}
    </g>
  );
}

function TerraMotif({ animate }) {
  const contours = [
    "M32 17c8 0 14 6 14 14s-5 16-14 16-15-6-15-15 7-15 15-15z",
    "M32 22c5 0 9 4 9 9s-3 11-9 11-10-4-10-10 5-10 10-10z",
    "M32 27c3 0 5 2 5 5s-2 6-5 6-5-2-5-5 2-6 5-6z",
  ];
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      {contours.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 - index * 0.15, scale: animate ? [1, 1.06, 1] : 1 }}
          transition={{
            pathLength: { duration: 0.6, delay: index * 0.12 },
            scale: { duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: index * 0.3 },
          }}
        />
      ))}
      <circle cx="32" cy="32" r="1.8" fill="currentColor" />
    </g>
  );
}

function AquaMotif({ animate }) {
  const wave = "M0 0 q4 -3 8 0 t8 0 t8 0 t8 0 t8 0 t8 0";
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2">
      <clipPath id="aqua-emblem-clip">
        <circle cx="32" cy="32" r="16" />
      </clipPath>
      <circle cx="32" cy="32" r="16" opacity="0.6" />
      <g clipPath="url(#aqua-emblem-clip)">
        {/* La posición va en el <g>: el `x` animado de framer reemplaza el transform del <path> */}
        {[26, 32, 38].map((y, index) => (
          <g key={y} transform={`translate(8 ${y})`}>
            <motion.path
              d={wave}
              opacity={1 - index * 0.2}
              animate={animate ? { x: [0, -16] } : undefined}
              transition={{ duration: 2.2 + index * 0.4, repeat: Infinity, ease: "linear" }}
            />
          </g>
        ))}
      </g>
      {animate && (
        <motion.circle
          cx="32"
          cy="32"
          r="16"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </g>
  );
}

const MOTIFS = { classic: GlobalMotif, terra: TerraMotif, aqua: AquaMotif };

// Bisel de radar: anillo con marcas que gira lento (continuidad entre vistas)
function RadarBezel({ animate }) {
  const ticks = Array.from({ length: 24 }, (_, index) => index * 15);
  return (
    <motion.g
      animate={animate ? { rotate: 360 } : undefined}
      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      stroke="currentColor"
    >
      <circle cx="32" cy="32" r="29" fill="none" strokeWidth="1" opacity="0.35" />
      {ticks.map((angle) => (
        <line
          key={angle}
          x1="32"
          y1="3"
          x2="32"
          y2={angle % 90 === 0 ? 8 : 5.5}
          strokeWidth="1"
          opacity={angle % 90 === 0 ? 0.9 : 0.4}
          transform={`rotate(${angle} 32 32)`}
        />
      ))}
    </motion.g>
  );
}

function DomainEmblem({ domain, size = 64 }) {
  const reduceMotion = useReducedMotion();
  const animate = !reduceMotion;
  // Acceso directo al registro: componentes estáticos para React
  const Motif = MOTIFS[domain] ?? MOTIFS.classic;

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0 text-sensor-accent">
      <RadarBezel animate={animate} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.g
          key={domain}
          initial={{ opacity: 0, scale: 0.6, rotate: -45 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={{ opacity: 0, scale: 0.6, rotate: 45 }}
          transition={MOTIF_TRANSITION}
        >
          <Motif animate={animate} />
        </motion.g>
      </AnimatePresence>
    </svg>
  );
}

export default DomainEmblem;
