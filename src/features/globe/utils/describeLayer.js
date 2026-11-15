// Lo que muestra cada nivel según la vista: en el globo, `sensor.layer`;
// en el mapa 2D, `sensor.map2d` (puede colorear tierra y mar a la vez).
// Devuelve { title, kind, note, source, variableIds }.
export function describeLayer(sensor, level) {
  if (level === "country") {
    const { title, kind, note, land, ocean } = sensor.map2d;
    return { title, kind, note, source: "Texturas ilustrativas locales", variableIds: [land, ocean].filter(Boolean) };
  }
  const { title, kind, note, source, variableId } = sensor.layer;
  return { title, kind, note, source, variableIds: variableId ? [variableId] : [] };
}
