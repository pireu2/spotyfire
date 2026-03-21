import { useState, useEffect, useCallback } from "react";
import { Alert } from "@/types";
import { AlertService } from "@/services/alertService";
import { compareAlertLists } from "@/utils/alert.utils";

export function useAlerts(
  accessToken?: string,
  pollingInterval: number = 30000,
) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    if (!accessToken) {
      setAlerts([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    try {
      setError(null);
      const newAlerts = await AlertService.getAll(accessToken);

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
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) {
      setAlerts([]);
      setIsLoading(false);
      return;
    }

    fetchAlerts();
    const interval = setInterval(fetchAlerts, pollingInterval);
    return () => clearInterval(interval);
  }, [accessToken, fetchAlerts, pollingInterval]);

  return { alerts, isLoading, error, refetch: fetchAlerts };
}
