import { compareProperties, filterByBounds, filterProperties } from "./searchEngine.js";

export function getMarketplaceFeed(properties, query) {
  const filtered = filterProperties(properties, query ?? {});
  const featured = filtered.filter((item) => item.featured).slice(0, 6);
  const recommended = filtered
    .filter((item) => item.recommended)
    .sort((a, b) => b.trustScore - a.trustScore)
    .slice(0, 12);

  return {
    total: filtered.length,
    featured,
    recommended,
  };
}

export function getMapDiscovery(properties, query) {
  const filtered = filterByBounds(filterProperties(properties, query ?? {}), query ?? {});
  return filtered.map((property) => ({
    id: property.id,
    title: property.title,
    city: property.city,
    area: property.area,
    lat: property.lat,
    lng: property.lng,
    priceNgn: property.priceNgn,
    trustScore: property.trustScore,
    verificationTier: property.verificationTier,
  }));
}

export function getRefinedSearch(properties, query) {
  const data = filterProperties(properties, query ?? {});
  return {
    count: data.length,
    data,
    filterEcho: {
      propertyType: query?.propertyType ?? "All",
      minPrice: Number(query?.minPrice ?? 0),
      maxPrice: Number(query?.maxPrice ?? 0),
      minPowerHours: Number(query?.minPowerHours ?? 0),
      waterSource: query?.waterSource ?? "Any",
    },
  };
}

export function getPropertyDetail(properties, id) {
  const property = properties.find((item) => item.id === id);
  if (!property) {
    return null;
  }

  return {
    ...property,
    trust: {
      trustScore: property.trust
