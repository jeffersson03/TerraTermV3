export function format(value, digits = 2) {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false,
  }).format(value).replace('-', '−')
}

export function signed(value, digits = 2) {
  return (value > 0 ? '+' : '') + format(value, digits)
}

export function precision(value) {
  return value !== 0 && Math.abs(value) < 0.01 ? 4 : 2
}
