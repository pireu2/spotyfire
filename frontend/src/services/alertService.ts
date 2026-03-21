import { Alert } from "@/types";
import { ApiService } from "./apiService";

export class AlertService {
  private static readonly ENDPOINT = "/api/alerts";

  private static normalizeAlerts(payload: unknown): Alert[] {
    const rawAlerts = Array.isArray(payload)
      ? payload
      : payload && typeof payload === "object" && "alerts" in payload
        ? (payload as { alerts?: unknown }).alerts
        : [];

    if (!Array.isArray(rawAlerts)) {
      return [];
    }

    return rawAlerts.map((alert: any) => ({
      id: String(alert.id),
      type: String(alert.type || "warning").toLowerCase() as Alert["type"],
      message: String(alert.message || ""),
      timestamp: new Date(alert.created_at || alert.timestamp || Date.now()),
      sector: String(alert.sector || "N/A"),
      severity: String(
        alert.severity || "low",
      ).toLowerCase() as Alert["severity"],
      lat: typeof alert.lat === "number" ? alert.lat : undefined,
      lng: typeof alert.lng === "number" ? alert.lng : undefined,
      created_at: alert.created_at,
      propertyId: alert.property_id || alert.propertyId,
    }));
  }

  static async getAll(accessToken?: string): Promise<Alert[]> {
    const payload = await ApiService.get<unknown>(this.ENDPOINT, accessToken);
    return this.normalizeAlerts(payload);
  }

  static async getByProperty(
    propertyId: string,
    accessToken?: string,
  ): Promise<Alert[]> {
    const payload = await ApiService.get<unknown>(
      `${this.ENDPOINT}?property_id=${propertyId}`,
      accessToken,
    );
    return this.normalizeAlerts(payload);
  }

  static async getById(alertId: string, accessToken?: string): Promise<Alert> {
    return ApiService.get<Alert>(`${this.ENDPOINT}/${alertId}`, accessToken);
  }

  static sortByTimestamp(alerts: Alert[]): Alert[] {
    return [...alerts].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });
  }

  static getAlertsByType(alerts: Alert[], type: string): Alert[] {
    return alerts.filter((alert) => alert.type === type);
  }

  static getAlertsBySeverity(alerts: Alert[], severity: string): Alert[] {
    return alerts.filter((alert) => alert.severity === severity);
  }

  static groupByType(alerts: Alert[]): Record<string, Alert[]> {
    return alerts.reduce(
      (acc, alert) => {
        if (!acc[alert.type]) acc[alert.type] = [];
        acc[alert.type].push(alert);
        return acc;
      },
      {} as Record<string, Alert[]>,
    );
  }

  static getRecentAlerts(alerts: Alert[], limit: number = 10): Alert[] {
    return this.sortByTimestamp(alerts).slice(0, limit);
  }

  static getHighSeverityAlerts(alerts: Alert[]): Alert[] {
    return alerts.filter(
      (a) => a.severity === "high" || a.severity === "critical",
    );
  }
}
