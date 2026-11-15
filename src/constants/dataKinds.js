// Tipos de información (principio de Transparencia de CLAUDE.md).
// Toda capa, valor o respuesta que se muestre debe declarar uno de estos tipos.
export const DATA_KINDS = Object.freeze({
  observation: {
    id: "observation",
    label: "Observación",
    description: "Medición directa de un sensor o estación.",
    dotClass: "bg-emerald-400",
  },
  estimate: {
    id: "estimate",
    label: "Estimación",
    description: "Valor derivado de modelos o interpolación.",
    dotClass: "bg-sky-400",
  },
  prediction: {
    id: "prediction",
    label: "Predicción",
    description: "Proyección futura con incertidumbre.",
    dotClass: "bg-violet-400",
  },
  ai: {
    id: "ai",
    label: "Interpretación IA",
    description: "Texto generado por el asistente; verificar con las fuentes.",
    dotClass: "bg-fuchsia-400",
  },
  imagery: {
    id: "imagery",
    label: "Imagen de referencia",
    description: "Imagen compuesta sin valores medibles.",
    dotClass: "bg-slate-400",
  },
  prototype: {
    id: "prototype",
    label: "Prototipo visual",
    description: "Datos ilustrativos; no provienen de mediciones.",
    dotClass: "bg-amber-400",
  },
});

export function getDataKind(kindId) {
  return DATA_KINDS[kindId] ?? DATA_KINDS.prototype;
}
