import { getDataKind } from "@/constants/dataKinds";

// Kinds que no muestran etiqueta. «Prototipo visual» se ocultó para limpiar la interfaz;
// la procedencia sigue visible en la fuente y la nota de cada capa (LayerInfo).
const HIDDEN_KINDS = new Set(["prototype"]);

// Etiqueta del tipo de información (observación, estimación, IA…).
// Reutilizable en capas, indicadores, gráficos y respuestas del asistente.
function StatusBadge({ kind, label, className = "" }) {
  if (HIDDEN_KINDS.has(kind)) return null;
  const dataKind = getDataKind(kind);

  return (
    <span
      title={dataKind.description}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-hud-border bg-space-800/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-ink-secondary ${className}`}
    >
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dataKind.dotClass}`} />
      {label ?? dataKind.label}
    </span>
  );
}

export default StatusBadge;
