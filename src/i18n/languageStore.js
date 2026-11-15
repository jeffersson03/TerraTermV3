import { create } from "zustand";

// Idiomas disponibles. Agregar uno = una entrada aquí + su diccionario en i18n/locales/.
// Rutas relativas (no `@/`): los formateadores lo usan y los tests de Node los importan.
export const LANGUAGES = Object.freeze({
  es: { id: "es", label: "ES", name: "Español", locale: "es" }, // "es" usa coma decimal (es-PE usaría punto)
  en: { id: "en", label: "EN", name: "English", locale: "en-US" },
});

export const DEFAULT_LANGUAGE = "es";
const STORAGE_KEY = "terraterm:idioma";

// Idioma inicial: el elegido antes (localStorage) o el del navegador. Sin navegador (tests): español.
function detectLanguage() {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (LANGUAGES[saved]) return saved;
  } catch {
    // almacenamiento bloqueado: se usa el idioma del navegador
  }
  const browser = (window.navigator?.language ?? "").slice(0, 2).toLowerCase();
  return LANGUAGES[browser] ? browser : DEFAULT_LANGUAGE;
}

function applyToDocument(lang) {
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

const initialLanguage = detectLanguage();
applyToDocument(initialLanguage);

// Idioma de la interfaz. Lo leen useT (componentes) y getLang (formateadores y servicios).
export const useLanguageStore = create((set) => ({
  lang: initialLanguage,

  setLang: (lang) => {
    if (!LANGUAGES[lang]) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // sin almacenamiento: el cambio dura hasta recargar
    }
    applyToDocument(lang);
    set({ lang });
  },
}));

export function getLang() {
  return useLanguageStore.getState().lang;
}

// Locale de Intl para números y fechas (es: 0,37 · en-US: 0.37)
export function getLocale(lang = getLang()) {
  return LANGUAGES[lang]?.locale ?? LANGUAGES[DEFAULT_LANGUAGE].locale;
}
