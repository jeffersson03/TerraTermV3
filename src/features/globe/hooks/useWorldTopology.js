import { useEffect, useMemo, useState } from "react";
import { feature, mesh } from "topojson-client";
import { buildCountryIndex, latLonToCartesian } from "@/features/globe/utils/geoMath";

const TOPOLOGY_URL = "/geo/countries-50m.topo.json";

// Caché a nivel de módulo de los datos que NO dependen del radio:
// se descarga y procesa una sola vez aunque el hook se monte varias veces.
let cachedTopology = null;
let pendingRequest = null;

function loadTopology() {
  if (cachedTopology) return Promise.resolve(cachedTopology);
  if (pendingRequest) return pendingRequest;

  pendingRequest = fetch(TOPOLOGY_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status} al cargar ${TOPOLOGY_URL}`);
      return res.json();
    })
    .then((topo) => {
      const countryFeatures = feature(topo, topo.objects.countries).features;
      cachedTopology = {
        countryFeatures, // polígonos por país (hover con d3-geo)
        countryIndex: buildCountryIndex(countryFeatures), // rectángulos para acelerar el hover
        bordersMesh: mesh(topo, topo.objects.countries), // fronteras compartidas (MultiLineString)
      };
      return cachedTopology;
    })
    .catch((err) => {
      pendingRequest = null; // permite reintentar en el próximo montaje
      throw err;
    });

  return pendingRequest;
}

// Convierte las fronteras en pares de vértices 3D a un radio dado (1 draw call).
function buildBorderPositions(bordersMesh, radius) {
  const positions = [];

  for (const arc of bordersMesh.coordinates) {
    for (let i = 0; i < arc.length - 1; i++) {
      const [lon1, lat1] = arc[i];
      const [lon2, lat2] = arc[i + 1];
      positions.push(...latLonToCartesian(lat1, lon1, radius), ...latLonToCartesian(lat2, lon2, radius));
    }
  }

  return new Float32Array(positions);
}

export function useWorldTopology(radius = 1.0015) {
  const [topology, setTopology] = useState(cachedTopology);

  useEffect(() => {
    if (topology) return;
    let isMounted = true;

    loadTopology()
      .then((data) => {
        if (isMounted) setTopology(data);
      })
      .catch((err) => console.error("[TerraTerm] Error cargando topología mundial:", err));

    return () => {
      isMounted = false;
    };
  }, [topology]);

  // Lo que depende del radio se recalcula aquí, no en la caché
  const borderPositions = useMemo(
    () => (topology ? buildBorderPositions(topology.bordersMesh, radius) : null),
    [topology, radius]
  );

  return useMemo(
    () =>
      topology
        ? { countryFeatures: topology.countryFeatures, countryIndex: topology.countryIndex, borderPositions }
        : null,
    [topology, borderPositions]
  );
}
