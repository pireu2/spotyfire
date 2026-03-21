import { HealthStatus, DisasterType, AlertSeverity } from "@/types";
import { DATETIME_FORMAT_OPTIONS } from "@/constants";

export class Formatter {
  static formatCurrency(value: number, currency: string = "RON"): string {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }

  static formatNumber(value: number, decimals: number = 2): string {
    return value.toLocaleString("ro-RO", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }

  static formatDate(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(
      "ro-RO",
      DATETIME_FORMAT_OPTIONS.DATE_SHORT,
    ).format(dateObj);
  }

  static formatTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(
      "ro-RO",
      DATETIME_FORMAT_OPTIONS.TIME_SHORT,
    ).format(dateObj);
  }

  static formatDateTime(date: Date | string): string {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return new Intl.DateTimeFormat(
      "ro-RO",
      DATETIME_FORMAT_OPTIONS.DATETIME_FULL,
    ).format(dateObj);
  }

  static formatArea(area: number, unit: "ha" | "m2" = "ha"): string {
    if (unit === "ha") {
      return `${this.formatNumber(area, 1)} ha`;
    }
    return `${this.formatNumber(area, 0)} m²`;
  }

  static formatPercentage(value: number, decimals: number = 1): string {
    return `${this.formatNumber(value, decimals)}%`;
  }

  static formatNDVI(value: number): string {
    return value.toFixed(3);
  }

  static getHealthStatusLabel(status: HealthStatus): string {
    const labels: Record<HealthStatus, string> = {
      healthy: "Sănătos",
      fire: "Incendiu Detectat",
      flood: "Inundație Detectată",
    };
    return labels[status];
  }

  static getHealthStatusColor(status: HealthStatus): string {
    const colors: Record<HealthStatus, string> = {
      healthy: "text-green-500",
      fire: "text-orange-500",
      flood: "text-blue-500",
    };
    return colors[status];
  }

  static getHealthStatusBgColor(status: HealthStatus): string {
    const colors: Record<HealthStatus, string> = {
      healthy: "bg-green-500/20",
      fire: "bg-orange-500/20",
      flood: "bg-blue-500/20",
    };
    return colors[status];
  }

  static getSeverityLabel(severity: AlertSeverity): string {
    const labels: Record<AlertSeverity, string> = {
      low: "Scăzut",
      medium: "Mediu",
      high: "Ridicat",
      critical: "Critic",
    };
    return labels[severity];
  }

  static getSeverityColor(severity: AlertSeverity): string {
    const colors: Record<AlertSeverity, string> = {
      low: "text-yellow-500",
      medium: "text-orange-500",
      high: "text-red-500",
      critical: "text-red-700",
    };
    return colors[severity];
  }

  static getAlertTypeLabel(type: DisasterType): string {
    const labels: Record<DisasterType, string> = {
      fire: "Incendiu",
      flood: "Inundație",
      warning: "Avertisment",
      ndvi: "Index Vegetație",
    };
    return labels[type];
  }

  static getNDVIHealthLabel(value: number): string {
    if (value >= 0.7) return "Excelent";
    if (value >= 0.5) return "Bun";
    if (value >= 0.3) return "Moderat";
    return "Critic";
  }

  static getNDVIHealthColor(value: number): string {
    if (value >= 0.7) return "text-green-500";
    if (value >= 0.5) return "text-green-400";
    if (value >= 0.3) return "text-yellow-500";
    return "text-red-500";
  }

  static abbreviate(text: string, maxLength: number = 30): string {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  }

  static pluralize(word: string, count: number): string {
    if (word === "teren") {
      return count === 1 ? "teren" : "terenuri";
    }
    if (word === "alертă") {
      return count === 1 ? "alertă" : "alerte";
    }
    return count === 1 ? word : `${word}s`;
  }
}
