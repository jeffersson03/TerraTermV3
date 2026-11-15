import { useId } from "react";
import "../styles/robotMascot.css";

// Paleta exclusiva del asistente.
const C = {
  accent: "#1A73C2", // azul intenso
  accentSoft: "#4DA8F0", // celeste
  teal: "#084054",
  navy: "#052E3D",
  white: "#FFFFFF",
};

/**
 * Mascota robot del asistente, dibujada en SVG y animada con CSS (robotMascot.css).
 * Cada parte (ojos, brazos, pies, cabeza, torso, audífonos) tiene su propia animación por estado.
 *
 * mood:    "idle" | "listening" | "thinking" | "speaking" | "happy" | "error"
 * size:    alto en píxeles (el ancho se calcula solo)
 * crop:    "full" (cuerpo entero) | "bust" (cabeza y pecho, para íconos pequeños)
 */
function RobotMascot({ mood = "idle", size = 120, crop = "full", className = "", title }) {
  const uid = useId().replace(/:/g, "");
  const viewBox = crop === "bust" ? "6 4 108 108" : "-4 -4 128 140";
  const [, , vw, vh] = viewBox.split(" ").map(Number);
  const line = { stroke: C.navy, strokeWidth: 4, strokeLinejoin: "round" };

  return (
    <svg
      className={`rb rb--${mood} ${className}`}
      width={(size * vw) / vh}
      height={size}
      viewBox={viewBox}
      role="img"
      aria-label={title ?? `Robot asistente (${mood})`}
      overflow="visible"
    >
      <defs>
        <clipPath id={`head-${uid}`}>
          <path d={HEAD} />
        </clipPath>
        <clipPath id={`body-${uid}`}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={`visor-${uid}`}>
          <path d={VISOR} />
        </clipPath>
      </defs>

      <ellipse className="rb-shadow" cx="60" cy="129" rx="30" ry="3.5" fill={C.navy} opacity="0.2" />

      <g className="rb-float">
        {/* Cables de los audífonos */}
        <g className="rb-cables" fill="none" stroke={C.navy} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="0.5 4">
          <path d="M24 60 C 19 76 25 90 37 97" />
          <path d="M96 60 C 101 76 95 90 83 97" />
        </g>

        {/* Pies (cada uno se mueve por separado) */}
        <g className="rb-foot rb-foot--l">
          <path d="M33 125 C 33 117 40 114 47 114 C 55 114 60 118 60 125 Z" fill={C.white} {...line} />
        </g>
        <g className="rb-foot rb-foot--r">
          <path d="M60 125 C 60 118 65 114 73 114 C 80 114 87 117 87 125 Z" fill={C.white} {...line} />
        </g>

        {/* Torso (respira) */}
        <g className="rb-torso">
          <path d={BODY} fill={C.white} />
          <g clipPath={`url(#body-${uid})`}>
            <path d="M32 74 L 50 74 C 46 90 50 106 58 122 L 32 122 Z" fill={C.accent} />
          </g>
          <path d={BODY} fill="none" {...line} />

          {/* Pantalla del pecho: muestra el estado */}
          <rect x="48" y="83" width="24" height="15" rx="4" fill={C.white} stroke={C.navy} strokeWidth="3" />
          <ChestScreen mood={mood} />
          <Mouth mood={mood} />
        </g>

        {/* Brazos (giran desde el hombro) */}
        <g className="rb-arm rb-arm--l">
          <ellipse cx="33" cy="101" rx="7.5" ry="10" fill={C.white} {...line} />
          <path d="M29 108 q2 2 4 0" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" />
        </g>
        <g className="rb-arm rb-arm--r">
          <ellipse cx="87" cy="101" rx="7.5" ry="10" fill={C.white} {...line} />
          <path d="M87 108 q2 2 4 0" fill="none" stroke={C.navy} strokeWidth="1.8" strokeLinecap="round" />
        </g>

        {/* Cabeza */}
        <g className="rb-head">
          {/* Ondas de sonido de los audífonos */}
          <g className="rb-waves" fill="none" stroke={C.accentSoft} strokeWidth="2.4" strokeLinecap="round">
            <path className="rb-wave-l1" d="M9 39 Q5 46 9 53" />
            <path className="rb-wave-l2" d="M3 34 Q-3 46 3 58" />
            <path className="rb-wave-r1" d="M111 39 Q115 46 111 53" />
            <path className="rb-wave-r2" d="M117 34 Q123 46 117 58" />
          </g>

          <g className="rb-ear rb-ear--l">
            <circle cx="25" cy="46" r="13" fill={C.accentSoft} {...line} />
            <circle className="rb-ear-light" cx="21" cy="46" r="3" fill={C.white} opacity="0.55" />
          </g>
          <g className="rb-ear rb-ear--r">
            <circle cx="95" cy="46" r="13" fill={C.accentSoft} {...line} />
            <circle className="rb-ear-light" cx="99" cy="46" r="3" fill={C.white} opacity="0.55" />
          </g>

          <path d={HEAD} fill={C.white} />
          <g clipPath={`url(#head-${uid})`}>
            <path d="M96 24 C 82 44 80 62 66 80 L 100 80 L 100 24 Z" fill={C.accent} />
          </g>
          <path d={HEAD} fill="none" {...line} />

          {/* Visor con brillo que lo cruza de vez en cuando */}
          <path d={VISOR} fill={C.navy} />
          <g clipPath={`url(#visor-${uid})`}>
            <rect className="rb-shine" x="20" y="10" width="9" height="60" fill={C.white} opacity="0.16" transform="skewX(-20)" />
          </g>
          <path d="M40 27 C 44 20 51 17.5 59 17.5" fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" />

          <Eyes mood={mood} />

          {/* Mejillas (aparecen cuando está feliz) */}
          <g className="rb-cheeks" fill={C.accentSoft}>
            <ellipse cx="40" cy="50" rx="4" ry="2.2" />
            <ellipse cx="80" cy="50" rx="4" ry="2.2" />
          </g>
        </g>

        {/* Extras por estado */}
        {mood === "thinking" && <ThoughtDots />}
        {mood === "happy" && <Sparkles />}
        {mood === "error" && <SweatDrop />}
      </g>
    </svg>
  );
}

const HEAD = "M60 9 C 86 9 93 28 93 45 C 93 66 81 78 60 78 C 39 78 27 66 27 45 C 27 28 34 9 60 9 Z";
const BODY = "M45 75 L 75 75 C 83 75 86 81 86 89 L 86 109 C 86 116 82 120 75 120 L 45 120 C 38 120 34 116 34 109 L 34 89 C 34 81 37 75 45 75 Z";
const VISOR = "M60 15 C 79 15 87 27 87 40 C 87 53 78 59 60 59 C 42 59 33 53 33 40 C 33 27 41 15 60 15 Z";

function Eyes({ mood }) {
  const stroke = { fill: "none", stroke: C.white, strokeWidth: 3.5, strokeLinecap: "round" };
  const eye = (side, x, shape) => (
    <g key={side} className={`rb-eye-wrap rb-eye-wrap--${side}`}>
      <g className={`rb-eye rb-eye--${side}`}>{shape(x)}</g>
    </g>
  );

  let shape = (x) => (
    <>
      <circle cx={x} cy="40" r="6.5" fill={C.white} />
      <circle className="rb-glint" cx={x + 2.2} cy="37.6" r="1.6" fill={C.accentSoft} opacity="0.9" />
    </>
  );
  if (mood === "happy") shape = (x) => <path d={`M${x - 6} 42 Q${x} 33 ${x + 6} 42`} {...stroke} />;
  if (mood === "error") shape = (x) => <path d={`M${x - 5} 35 L${x + 5} 45 M${x + 5} 35 L${x - 5} 45`} {...stroke} />;

  return <g className="rb-eyes">{[eye("l", 47, shape), eye("r", 73, shape)]}</g>;
}

function Mouth({ mood }) {
  if (mood === "speaking") {
    return <ellipse className="rb-mouth rb-mouth--talk" cx="60" cy="106" rx="4" ry="2.6" fill={C.navy} />;
  }
  if (mood === "happy") {
    return <path className="rb-mouth" d="M53.5 103.5 Q60 111 66.5 103.5 Z" fill={C.navy} strokeLinejoin="round" />;
  }
  if (mood === "listening") {
    return <circle className="rb-mouth rb-mouth--o" cx="60" cy="106" r="2.2" fill={C.navy} />;
  }
  return (
    <path
      className="rb-mouth"
      d={mood === "error" ? "M54 107 Q60 104 66 107" : mood === "thinking" ? "M55 106 Q59 104 65 107" : "M54 104 Q60 108.5 66 104"}
      fill="none"
      stroke={C.navy}
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  );
}

function ChestScreen({ mood }) {
  switch (mood) {
    case "thinking":
      return (
        <g fill={C.navy}>
          {[53.5, 60, 66.5].map((x, i) => (
            <circle key={x} className="rb-dot" style={{ animationDelay: `${i * 0.18}s` }} cx={x} cy="90.5" r="2" />
          ))}
        </g>
      );
    case "speaking":
      return (
        <g fill={C.accent}>
          {[52, 56.5, 61, 65.5].map((x, i) => (
            <rect key={x} className="rb-bar" style={{ animationDelay: `${i * 0.12}s` }} x={x} y="85.5" width="2.8" height="10" rx="1.4" />
          ))}
        </g>
      );
    case "happy":
      return (
        <path
          className="rb-heart"
          d="M60 95.5 C 54 91.5 53.5 88 56 86.6 C 57.6 85.8 59.2 86.6 60 88 C 60.8 86.6 62.4 85.8 64 86.6 C 66.5 88 66 91.5 60 95.5 Z"
          fill={C.accent}
        />
      );
    case "error":
      return (
        <g className="rb-alert" fill={C.accent}>
          <rect x="58.6" y="85" width="2.8" height="7" rx="1.4" />
          <circle cx="60" cy="94.6" r="1.6" />
        </g>
      );
    case "listening":
      return (
        <g fill="none" stroke={C.accent} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="60" cy="90.5" r="1.8" fill={C.accent} stroke="none" />
          <path className="rb-pulse rb-pulse--1" d="M56 87.5 Q54.5 90.5 56 93.5 M64 87.5 Q65.5 90.5 64 93.5" />
          <path className="rb-pulse rb-pulse--2" d="M53 86 Q50.6 90.5 53 95 M67 86 Q69.4 90.5 67 95" />
        </g>
      );
    default:
      return (
        <g fill={C.navy}>
          <rect className="rb-line rb-line--1" x="53" y="88" width="14" height="2" rx="1" />
          <rect className="rb-line rb-line--2" x="53" y="92" width="9" height="2" rx="1" />
        </g>
      );
  }
}

function ThoughtDots() {
  return (
    <g fill={C.white} stroke={C.navy} strokeWidth="2.5">
      <circle className="rb-bubble" style={{ animationDelay: "0s" }} cx="100" cy="20" r="3" />
      <circle className="rb-bubble" style={{ animationDelay: "0.25s" }} cx="107" cy="11" r="4" />
      <circle className="rb-bubble" style={{ animationDelay: "0.5s" }} cx="115" cy="2" r="2.6" />
    </g>
  );
}

function Sparkles() {
  const star = (x, y, s) =>
    `M${x} ${y - s} L${x + s * 0.3} ${y - s * 0.3} L${x + s} ${y} L${x + s * 0.3} ${y + s * 0.3} L${x} ${y + s} L${x - s * 0.3} ${y + s * 0.3} L${x - s} ${y} L${x - s * 0.3} ${y - s * 0.3} Z`;
  return (
    <g>
      <path className="rb-spark" d={star(105, 14, 5)} fill={C.accentSoft} />
      <path className="rb-spark" style={{ animationDelay: "0.35s" }} d={star(13, 20, 4)} fill={C.accent} />
      <path className="rb-spark" style={{ animationDelay: "0.7s" }} d={star(112, 70, 3)} fill={C.accentSoft} />
      <path className="rb-spark" style={{ animationDelay: "1s" }} d={star(6, 78, 3)} fill={C.accentSoft} />
    </g>
  );
}

function SweatDrop() {
  return <path className="rb-sweat" d="M90 18 C 87 23 86 25 88.5 27 C 91 29 94 27 93 24 C 92.6 22.5 91.5 20.5 90 18 Z" fill={C.accentSoft} stroke={C.navy} strokeWidth="1.6" />;
}

export default RobotMascot;
