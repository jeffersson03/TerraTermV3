// Países con mapa 2D habilitado. La clave es el `id` del país en
// /geo/countries-50m.topo.json (world-atlas, código ISO 3166-1 numérico).
//
// Para habilitar otro país: añadir su entrada con el archivo de divisiones
// (ADM1 de geoBoundaries, GeoJSON) y ningún componente cambia.
//
//   iso3            → código ISO alfa-3; filtra el GeoJSON por `shapeGroup`
//   adm1Url         → departamentos / estados (GeoJSON). Si falta o no coincide,
//                     se usa el contorno del país como única región de tierra.
//   adm1NameField   → propiedad con el nombre de cada división
//   oceanMarginDeg  → grados de océano que se añaden a cada lado de la vista
export const COUNTRIES = Object.freeze({
  604: {
    id: "604",
    iso3: "PER",
    name: "Perú",
    adm1Url: "/geo/per-adm1.geojson",
    adm1NameField: "shapeName",
    oceanMarginDeg: { west: 6, east: 1, south: 1, north: 1 },
  },
});

export const PILOT_COUNTRY_ID = "604";

export function getCountry(countryId) {
  return COUNTRIES[String(countryId)] ?? null;
}
