// Pasos del explorador en el mapa 2D del país. No se recorren solos: se
// habilitan según la selección (`isAvailable`) y la barra inferior solo
// permite ir a los disponibles. Para añadir un paso: entrada aquí + panel
// en components/panelRegistry.js.
export const EXPLORER_STEPS = Object.freeze([
  {
    id: "country",
    label: "País",
    caption: "Selecciona zonas en el mapa para analizarlas.",
    isAvailable: () => true,
  },
  {
    id: "cell",
    label: "Celda",
    caption: "La celda resalta el área que representa la serie analizada.",
    isAvailable: (selection) => selection.length >= 1,
  },
  {
    id: "compare",
    label: "Comparar",
    caption: "Dos zonas, una variable y el mismo periodo.",
    isAvailable: (selection) => selection.length === 2,
  },
  {
    id: "period",
    label: "Periodo",
    caption: "La señal depende del periodo: compara la serie larga con la era satelital.",
    isAvailable: (selection) => selection.length === 2,
  },
  {
    id: "city",
    label: "Ciudad",
    caption: "El detalle urbano abrirá una escena térmica fechada cuando esté disponible.",
    isAvailable: (selection) => selection.some((region) => region.kind === "land"),
  },
]);

export function getStep(stepId) {
  return EXPLORER_STEPS.find((step) => step.id === stepId) ?? EXPLORER_STEPS[0];
}

export function isStepAvailable(stepId, selection) {
  return getStep(stepId).isAvailable(selection);
}
