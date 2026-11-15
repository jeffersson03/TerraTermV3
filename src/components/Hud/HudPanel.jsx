import { useId } from "react";

const CORNER_POSITIONS = ["-left-1 -top-1", "-right-1 -top-1", "-left-1 -bottom-1", "-right-1 -bottom-1"];

// Marcas de mira (+) en las esquinas del panel (estilo HUD).
function CornerMarks() {
  return CORNER_POSITIONS.map((position) => (
    <span
      key={position}
      aria-hidden="true"
      className={`pointer-events-none absolute ${position} font-mono text-[10px] leading-none text-hud-crosshair`}
    >
      +
    </span>
  ));
}

// Contenedor estándar de la interfaz: título en mayúsculas, acciones opcionales
// y marcas de esquina. Todos los paneles (filtros, dashboard, alertas, asistente)
// deben usarlo en lugar de crear su propio contenedor.
function HudPanel({ title, actions, corners = true, as: Tag = "section", className = "", children }) {
  const titleId = useId();

  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={`relative rounded-sm border border-hud-border bg-space-900/85 p-3 backdrop-blur-md ${className}`}
    >
      {corners && <CornerMarks />}

      {(title || actions) && (
        <header className="mb-2 flex items-center justify-between gap-2">
          {title && (
            <h2 id={titleId} className="text-xs font-semibold uppercase tracking-[0.08em] text-ink">
              {title}
            </h2>
          )}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </header>
      )}

      {children}
    </Tag>
  );
}

export default HudPanel;
