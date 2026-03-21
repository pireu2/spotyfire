import { useState, useEffect } from "react";
import { Property, LandParcel } from "@/types";
import { PropertyService } from "@/services/propertyService";
import { propertiesToParcels } from "@/utils/property.utils";

export function useProperties(userId?: string, accessToken?: string) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [parcels, setParcels] = useState<LandParcel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId || !accessToken) {
      setProperties([]);
      setParcels([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await PropertyService.getAll(accessToken);
        setProperties(data);
        setParcels(propertiesToParcels(data));
      } catch (err) {
        setError(err as Error);
        console.error("Failed to fetch properties:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [userId, accessToken]);

  return { properties, parcels, isLoading, error };
}
