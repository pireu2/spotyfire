import { Property, LandParcel } from "@/types";

export function propertyToParcel(property: Property): LandParcel {
  return {
    id: property.id,
    name: property.name,
    coordinates: property.geometry.coordinates[0] as [number, number][],
    ndviIndex: 1 - property.risk_score / 100,
    status:
      property.risk_score > 70
        ? "fire"
        : property.risk_score > 40
          ? "flood"
          : "healthy",
    area: property.area_ha,
    damageEstimate:
      property.risk_score > 50
        ? property.estimated_value * (property.risk_score / 100)
        : undefined,
    activePackage: property.activePackage || "Basic",
    reportsLeft: property.reportsLeft !== undefined ? property.reportsLeft : 5,
  };
}

export function propertiesToParcels(properties: Property[]): LandParcel[] {
  return properties.map(propertyToParcel);
}

export function calculateAverageNDVI(parcels: LandParcel[]): number {
  if (parcels.length === 0) return 0;
  return parcels.reduce((acc, p) => acc + p.ndviIndex, 0) / parcels.length;
}
