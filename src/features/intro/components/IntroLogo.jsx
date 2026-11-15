import { useEffect } from "react";
import { motion } from "framer-motion";
import "../styles/introLogo.css";

const EASE = [0.22, 1, 0.36, 1];
const LETTERS = ["T", "E", "R", "R", "A", "T", "E", "R", "M"];

// Geometría de la esfera y la órbita (coordenadas del viewBox 0–120)
const SPHERE_R = 34;
const MERIDIAN_RX = [34, 25, 13]; // meridianos vistos en perspectiva (elipses cada vez más estrechas)
const PARALLEL_DY = [-24, -12.5, 0, 12.5, 24]; // paralelos: distancia al ecuador
// Órbita inclinada partida en dos mitades: la de atrás se dibuja ANTES de la esfera (queda tapada)
// y la de delante DESPUÉS, así la esfera queda en medio del anillo.
const ORBIT_BACK = "M4 60 A56 15 0 0 1 116 60";
const ORBIT_FRONT = "M116 60 A56 15 0 0 1 4 60";
const ORBIT_TILT = "rotate(-20 60 60)";

// Esfera con halo, cuadrícula (meridianos y paralelos recortados a la esfera), sombra de volumen
// y órbita que pasa por detrás y por delante con un satélite recorriendo la mitad frontal.
function IntroSphere({ reducedMotion, transition }) {
  return (
    <svg viewBox="0 0 120 120" className="size-40 overflow-visible sm:size-52" aria-hidden="true">
      <defs>
        <radialGradient id="intro-planet" cx="38%" cy="32%" r="75%">
          <stop offset="0%" stopColor="var(--color-aqua-400)" />
          <stop offset="45%" stopColor="#0e4a6e" />
          <stop offset="100%" stopColor="#04121f" />
        </radialGradient>
        <radialGradient id="intro-shade" cx="75%" cy="78%" r="70%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="60%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="intro-halo" cx="50%" cy="50%" r="50%">
          <stop offset="62%" stopColor="var(--color-aqua-400)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--color-aqua-400)" stopOpacity="0" />
        </radialGradient>
        <clipPath id="intro-sphere-clip">
          <circle cx="60" cy="60" r={SPHERE_R} />
        </clipPath>
      </defs>

      {/* Mitad trasera de la órbita (queda detrás de la esfera) */}
      <g transform={ORBIT_TILT}>
        <path className="intro-orbit intro-orbit--back" d={ORBIT_BACK} pathLength="1" fill="none" stroke="var(--sensor-accent)" strokeWidth="1.2" />
      </g>

      <motion.g
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={transition(0.15, 0.9)}
        style={{ transformOrigin: "60px 60px" }}
      >
        <circle cx="60" cy="60" r={SPHERE_R + 8} fill="url(#intro-halo)" />
        <circle cx="60" cy="60" r={SPHERE_R} fill="url(#intro-planet)" />

        {/* Cuadrícula de latitud/longitud, inclinada como el eje terrestre */}
        <g className="intro-grid" clipPath="url(#intro-sphere-clip)">
          <g transform="rotate(-15 60 60)" fill="none" stroke="var(--color-aqua-400)" strokeWidth="0.6">
            {MERIDIAN_RX.map((rx) => (
              <ellipse key={rx} cx="60" cy="60" rx={rx} ry={SPHERE_R} />
            ))}
            <line x1="60" y1={60 - SPHERE_R} x2="60" y2={60 + SPHERE_R} />
            {PARALLEL_DY.map((dy) => (
              <ellipse key={dy} cx="60" cy={60 + dy} rx={Math.sqrt(SPHERE_R ** 2 - dy ** 2)} ry="2.6" />
            ))}
          </g>
        </g>

        <circle cx="60" cy="60" r={SPHERE_R} fill="url(#intro-shade)" />
        <circle cx="60" cy="60" r={SPHERE_R} fill="none" stroke="var(--color-aqua-400)" strokeOpacity="0.45" strokeWidth="0.6" />
      </motion.g>

      {/* Mitad delantera de la órbita + satélite que la recorre */}
      <g transform={ORBIT_TILT}>
        <path className="intro-orbit intro-orbit--front" d={ORBIT_FRONT} pathLength="1" fill="none" stroke="var(--sensor-accent)" strokeWidth="1.5" />
        {reducedMotion ? (
          <circle cx="4" cy="60" r="3" fill="var(--sensor-accent)" />
        ) : (
          <circle r="3" fill="var(--sensor-accent)" className="intro-satellite">
            <animateMotion dur="1.6s" begin="1.1s" fill="freeze" path={ORBIT_FRONT} keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines="0.45 0 0.55 1" />
          </circle>
        )}
      </g>
    </svg>
  );
}

// Logo animado: se usa si no hay video (o no se puede reproducir) y con «movimiento reducido».
// Órbita que se dibuja + planeta que aparece + letras escalonadas. Llama a onDone al terminar.
function IntroLogo({ durationMs, reducedMotion = false, onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, reducedMotion ? 600 : durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, reducedMotion, onDone]);

  const transition = (delay, duration = 0.7) => (reducedMotion ? { duration: 0 } : { delay, duration, ease: EASE });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-space-950">
      <IntroSphere reducedMotion={reducedMotion} transition={transition} />

      <p className="flex text-2xl font-semibold tracking-[0.3em] sm:text-3xl" aria-label="TerraTerm">
        {LETTERS.map((letter, index) => (
          <motion.span
            key={index}
            aria-hidden="true"
            className={index >= 5 ? "text-sensor-accent" : "text-ink"}
            initial={{ opacity: 0, y: 14, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={transition(0.7 + index * 0.06, 0.5)}
          >
            {letter}
          </motion.span>
        ))}
      </p>
      <motion.p
        className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink-muted"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={transition(1.4)}
      >
        Geospatial intelligence
      </motion.p>
    </div>
  );
}

export default IntroLogo;
