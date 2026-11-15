// Formato numérico del módulo de análisis según el idioma (signo menos tipográfico).
// Ruta relativa: los tests de Node importan este módulo (sin navegador → español).
// En componentes pasa el `locale` de useT() como último argumento (React Compiler memoriza por argumentos).
import { getLocale } from '../../../i18n/languageStore.js'

export function format(value, digits = 2, locale = getLocale()) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false,
  }).format(value).replace('-', '−')
}

export function signed(value, digits = 2, locale = getLocale()) {
  return (value > 0 ? '+' : '') + format(value, digits, locale)
}

export function precision(value) {
  return value !== 0 && Math.abs(value) < 0.01 ? 4 : 2
}
