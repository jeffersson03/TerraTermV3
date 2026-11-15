import { motion } from "framer-motion";
import { SENSOR_ORDER, getSensor } from "@/constants/sensors";

// Cada botón lleva su propio `data-sensor`, así las clases `*-sensor-accent`
// toman el color de SU vista. No hace falta una clase distinta por dominio.
const ACTIVE_PILL_CLASSES =
  "bg-gradient-to-r from-sensor-accent/15 via-space-800 to-space-800 border-sensor-accent/50 shadow-[0_0_20px_-5px_var(--sensor-glow)]";

const CONTAINER_CLASSES = {
  floating: "inline-flex items-center gap-1.5 rounded-lg border border-hud-border bg-space-900/85 p-1.5 shadow-2xl shadow-black/60 backdrop-blur-xl",
  embedded: "flex w-full items-center gap-1", // dentro de otro panel (SensorConsole)
  corner: "inline-flex items-center gap-1 rounded-lg border border-hud-border bg-space-900/90 p-1 shadow-2xl shadow-black/60 backdrop-blur-xl",
};

// Relleno de cada botón por variante. `corner`: botones táctiles de 44 px; solo icono si el mapa
// es estrecho (móvil o dock abierto) y con etiqueta cuando hay espacio (@container ≥ 48rem).
const BUTTON_CLASSES = {
  floating: "px-3 sm:px-4",
  embedded: "flex flex-1 justify-center px-2",
  corner: "flex min-h-11 min-w-11 items-center justify-center px-2.5 @3xl:px-3",
};

// `variant`: 'floating' (control suelto) | 'embedded' (sin marco, ocupa el ancho) | 'corner' (esquina del mapa 2D)
// `pillId`: id de la animación de la píldora; distinto si hay dos selectores a la vez
function DomainSwitcher({ domain, onChange, variant = "floating", pillId = "domain-pill" }) {
  const isCorner = variant === "corner";

  return (
    <div role="group" aria-label="Vista del globo (atajo: Espacio)" className={CONTAINER_CLASSES[variant]}>
      {SENSOR_ORDER.map((key) => {
        const item = getSensor(key);
        const Icon = item.icon;
        const isActive = domain === key;

        return (
          <button
            key={key}
            type="button"
            data-sensor={key}
            aria-pressed={isActive}
            aria-label={isCorner ? `${item.label}: ${item.description}` : undefined}
            title={item.description}
            onClick={() => onChange(key)}
            className={`
              group relative py-2 rounded-md ${BUTTON_CLASSES[variant] ?? BUTTON_CLASSES.floating}
              font-mono text-xs tracking-wider
              transition-colors duration-300 cursor-pointer
              focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-sensor-accent
              ${isActive ? "text-ink" : "text-ink-muted hover:text-ink"}
            `}
          >
            {/* Fondo deslizante dinámico con Framer Motion */}
            {isActive && (
              <motion.div
                layoutId={pillId}
                className={`
                  absolute inset-0 rounded-md border
                  ${ACTIVE_PILL_CLASSES}
                `}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 32,
                }}
              />
            )}

            {/* Contenido del botón */}
            <span className="relative z-10 flex items-center gap-2.5">
              {/* Indicador LED de estado */}
              <span className={`relative h-2 w-2 ${isCorner ? "hidden @3xl:flex" : "flex"}`}>
                {isActive && (
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-sensor-accent`}
                  />
                )}
                <span
                  className="relative inline-flex rounded-full h-2 w-2 bg-sensor-accent"
                />
              </span>

              {/* Icono dinámico con micro-interacción */}
              <Icon
                aria-hidden="true"
                className={`
                  ${isCorner ? "w-4 h-4" : "w-3.5 h-3.5"} transition-transform duration-300
                  ${isActive ? "text-sensor-accent scale-110" : "text-ink-muted group-hover:text-ink"}
                `}
              />

              {/* Etiqueta y sensor */}
              <span className={`items-center gap-1.5 ${isCorner ? "hidden @3xl:flex" : "flex"}`}>
                <span className="font-semibold">{item.label}</span>
                <span
                  className={`hidden text-[11px] sm:inline ${
                    isActive ? "text-sensor-accent" : "opacity-60"
                  }`}
                >
                  {item.sensor}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default DomainSwitcher;
