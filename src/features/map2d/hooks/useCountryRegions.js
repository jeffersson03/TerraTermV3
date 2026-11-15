import { useEffect, useMemo, useState } from "react";
import { geoBounds } from "d3-geo";
import { getCountry } from "@/constants/countries";
import { useWorldTopology } from "@/features/globe/hooks/useWorldTopology";
import { getAdminBoundaries } from "@/services/geospatial/boundariesService";
import { buildOceanGrid } from "@/features/map2d/utils/oceanGrid";
import { featureToLandRegion, rewindFeature } from "@/features/map2d/utils/regionModel";

function expandBbox([[west, south], [east, north]], margin) {
  return [west - margin.west, south - margin.south, east + margin.east, north + margin.north];
}

function bboxIntersects([w1, s1, e1, n1], [[w2, s2], [e2, n2]]) {
  return w2 <= e1 && e2 >= w1 && s2 <= n1 && n2 >= s1;
}

/**
 * Todo lo que el mapa 2D necesita de un país:
 *   viewBbox        → área visible [oeste, sur, este, norte] (país + margen de océano)
 *   landRegions     → departamentos (ADM1) o, si no hay archivo válido, el contorno del país
 *   oceanRegions    → celdas 1°×1° de océano dentro de la vista
 *   contextFeatures → países vecinos (solo contorno de referencia)
 *   usedFallback    → true si se usó el contorno del país en lugar de ADM1
 */
export function useCountryRegions(countryId) {
  const country = getCountry(countryId);
  const topology = useWorldTopology();
  const [adm1, setAdm1] = useState({ url: null, features: [] });

  useEffect(() => {
    if (!country?.adm1Url) return;
    const controller = new AbortController();
    getAdminBoundaries({ url: country.adm1Url, iso3: country.iso3, signal: controller.signal })
      .then((features) => setAdm1({ url: country.adm1Url, features }))
      .catch(() => {
        if (!controller.signal.aborted) setAdm1({ url: country.adm1Url, features: [] });
      });
    return () => controller.abort();
  }, [country]);

  const isAdm1Ready = !country?.adm1Url || adm1.url === country.adm1Url;

  return useMemo(() => {
    if (!country || !topology || !isAdm1Ready) return { status: "loading", country };

    const countryFeature = topology.countryFeatures.find((feature) => String(feature.id) === country.id);
    if (!countryFeature) return { status: "error", country };

    const viewBbox = expandBbox(geoBounds(countryFeature), country.oceanMarginDeg);
    const adm1Features = adm1.features.map(rewindFeature);
    const usedFallback = adm1Features.length === 0;
    const landRegions = usedFallback
      ? [featureToLandRegion({ ...countryFeature, properties: { name: country.name } }, "name")]
      : adm1Features.map((feature) => featureToLandRegion(feature, country.adm1NameField));

    return {
      status: "ready",
      country,
      countryFeature,
      viewBbox,
      landRegions,
      oceanRegions: buildOceanGrid(viewBbox, topology.countryIndex),
      contextFeatures: topology.countryIndex
        .filter(({ feature, bounds }) => feature !== countryFeature && bboxIntersects(viewBbox, bounds))
        .map(({ feature }) => feature),
      usedFallback,
    };
  }, [country, topology, isAdm1Ready, adm1.features]);
}
