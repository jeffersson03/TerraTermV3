// Elementos donde las teclas ya tienen un uso nativo (escribir, pulsar un
// botón, mover un slider…). Los atajos globales no deben actuar ahí.
const INTERACTIVE_SELECTOR = [
  "input",
  "textarea",
  "select",
  "button",
  "a[href]",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[role='button']",
  "[role='checkbox']",
  "[role='switch']",
  "[role='radio']",
  "[role='tab']",
  "[role='slider']",
  "[role='menuitem']",
  "[role='option']",
  "[role='textbox']",
].join(",");

export function isInteractiveTarget(target) {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}
