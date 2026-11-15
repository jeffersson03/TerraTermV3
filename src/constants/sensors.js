import { Flame, Globe, Waves } from "lucide-react";

// Registro ÚNICO de vistas/sensores. Todo componente que necesite saber algo
// de una vista (color, etiqueta, icono, mezcla del shader, fronteras) lo lee de aquí.
//
// Para añadir una vista nueva:
//   1. Agregar una entrada en SENSORS y su id en SENSOR_ORDER.
//   2. Agregar su bloque [data-sensor="…"] en src/styles/theme.css.
//   Ningún componente cambia.
//
// Los hex replican los tokens de theme.css para Three.js (el canvas 3D no lee
// clases de Tailwind). Si cambias un color, cámbialo en ambos sitios.
//
// `layer` describe lo que el globo muestra en esa vista (rigor científico):
//   variableId  → variable del catálogo (src/constants/variables.js). De ahí salen
//                 unidad, rango y paleta: 0 y 1 de la textura = range[0] y range[1].
//   kind        → tipo de información (src/constants/dataKinds.js)
//   source/note → procedencia y limitaciones de ESTA textura, visibles para el usuario
//
// Reglas del mapa 2D del país (features/map2d):
//   selectableKinds → qué zonas se pueden seleccionar y comparar ('land' | 'ocean')
//   map2d           → variable que colorea tierra y mar (null = zona oscura) y
//                     texto de la leyenda. Variables con textura: src/constants/textures.js
export const SENSORS = Object.freeze({
  classic: {
    id: "classic",
    label: "GLOBAL",
    sensor: "",
    description: "Vista general (Blue Marble)",
    icon: Globe,
    accent: "#34d399", // --color-classic-400
    accentStrong: "#34d399", // --color-classic-500
    shaderMix: 0, // posición en la mezcla del shader de EarthGlobe
    borders: { baseColor: "#ffffff", baseOpacity: 0.22, hoverColor: "#34d399" },
    layer: {
      title: "Blue Marble",
      variableId: null,
      kind: "imagery",
      source: "NASA Visible Earth — Blue Marble",
      note: "Imagen compuesta de referencia; no corresponde a una fecha concreta.",
    },
    selectableKinds: ["land", "ocean"],
    map2d: {
      title: "Mapa térmico general (tierra + mar)",
      land: "lst",
      ocean: "sst",
      kind: "prototype",
      note: "Compara tierra con océano: correlación entre la temperatura del mar y la lluvia.",
    },
  },
  terra: {
    id: "terra",
    label: "TERRA",
    sensor: "LST",
    description: "Temperatura superficial terrestre",
    icon: Flame,
    accent: "#fbbf24", // --color-terra-400
    accentStrong: "#f59e0b", // --color-terra-500
    shaderMix: 1,
    borders: { baseColor: "#f59e0b", baseOpacity: 0.45, hoverColor: "#fbbf24" },
    layer: {
      title: "Temperatura superficial terrestre (LST)",
      variableId: "lst",
      kind: "prototype",
      source: "Textura ilustrativa local (terra-thermal.png)",
      note: "Valores ilustrativos, no medidos. Se reemplazará por NASA MODIS LST (GIBS).",
    },
    selectableKinds: ["land"],
    map2d: {
      title: "Temperatura superficial terrestre (LST)",
      land: "lst",
      ocean: null,
      kind: "prototype",
      note: "Solo se comparan departamentos entre sí.",
    },
  },
  aqua: {
    id: "aqua",
    label: "AQUA",
    sensor: "SST",
    description: "Temperatura superficial del mar",
    icon: Waves,
    accent: "#38bdf8", // --color-aqua-400
    accentStrong: "#0ea5e9", // --color-aqua-500
    shaderMix: 2,
    borders: { baseColor: "#1e293b", baseOpacity: 0.55, hoverColor: "#38bdf8" },
    layer: {
      title: "Temperatura superficial del mar (SST)",
      variableId: "sst",
      kind: "prototype",
      source: "Textura ilustrativa local (aqua-thermal.png)",
      note: "Valores ilustrativos, no medidos. Se reemplazará por NASA GHRSST / MODIS SST (GIBS).",
    },
    selectableKinds: ["ocean"],
    map2d: {
      title: "Temperatura superficial del mar (SST)",
      land: null,
      ocean: "sst",
      kind: "prototype",
      note: "Solo se comparan celdas de océano entre sí.",
    },
  },
});

// Orden de aparición en el switcher y del ciclo con [Espacio].
export const SENSOR_ORDER = Object.freeze(["classic", "terra", "aqua"]);

export const DEFAULT_SENSOR_ID = SENSORS.classic.id;

export function getSensor(sensorId) {
  return SENSORS[sensorId] ?? SENSORS[DEFAULT_SENSOR_ID];
}
