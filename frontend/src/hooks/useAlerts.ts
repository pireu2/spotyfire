import { useState, useEffect, useCallback } from "react";
import { Alert } from "@/types";
import { ApiService } from "@/services/api.service";
import { compareAlertLists } from "@/utils/alert.utils";

export function useAlerts(pollingInterval: number = 30000) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const newAlerts = await ApiService.getAlerts();

      setAlerts((prevAlerts) => {
        if (compareAlertLists(prevAlerts, newAlerts)) {
          return prevAlerts;
        }
        return newAlerts;
      });

      setIsLoading(false);
    } catch (err) {
      setError(err as Error);
      console.error("Failed to fetch alerts:", err);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollingInterval);
    return () => clearInterval(interval);
  }, [fetchAlerts, pollingInterval]);

  return { alerts, isLoading, error, refetch: fetchAlerts };
}
