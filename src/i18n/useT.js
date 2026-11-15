import { es } from "./locales/es.js";
import { en } from "./locales/en.js";
import { DEFAULT_LANGUAGE, getLang, getLocale, useLanguageStore } from "./languageStore.js";

const DICTIONARIES = { es, en };

function lookup(dictionary, key) {
  return key.split(".").reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

// "Hola {name}" + { name: "Ica" } → "Hola Ica"
function interpolate(text, vars) {
  if (!vars || typeof text !== "string") return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (vars[name] ?? match));
}

/**
 * Texto de la interfaz por clave ("dock.trends"). Si falta en el idioma activo usa el español;
 * si tampoco existe, devuelve la clave (así se nota en pantalla qué falta traducir).
 */
export function translate(lang, key, vars) {
  const value = lookup(DICTIONARIES[lang], key) ?? lookup(DICTIONARIES[DEFAULT_LANGUAGE], key) ?? key;
  return interpolate(value, vars);
}

/**
 * Texto de un catálogo (sensores, variables, pasos, países…). Los catálogos de constants/ siguen
 * en español (son la fuente); el inglés vive en en.catalog.<grupo>.<id>.<campo>.
 */
export function translateCatalog(lang, group, id, field, fallback) {
  if (lang === DEFAULT_LANGUAGE) return fallback;
  return lookup(DICTIONARIES[lang]?.catalog, `${group}.${id}.${field}`) ?? fallback;
}

// Fuera de componentes (servicios, formateadores): idioma actual sin suscripción.
export function t(key, vars) {
  return translate(getLang(), key, vars);
}

/**
 * Hook de traducción. Suscribe el componente al idioma: al cambiarlo se vuelve a renderizar.
 * Devuelve { t, tc, lang, locale }.
 */
export function useT() {
  const lang = useLanguageStore((state) => state.lang);
  return {
    lang,
    locale: getLocale(lang),
    t: (key, vars) => translate(lang, key, vars),
    tc: (group, id, field, fallback) => translateCatalog(lang, group, id, field, fallback),
  };
}
