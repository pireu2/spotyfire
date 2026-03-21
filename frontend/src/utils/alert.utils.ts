import { Alert } from "@/types";

export function compareAlertLists(prev: Alert[], next: Alert[]): boolean {
  const prevIds = prev
    .map((a) => a.id)
    .sort()
    .join(",");
  const nextIds = next
    .map((a) => a.id)
    .sort()
    .join(",");
  return prevIds === nextIds;
}

export function sortAlertsByTimestamp(alerts: Alert[]): Alert[] {
  return [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function getAlertColor(type: string): string {
  const lowerType = type.toLowerCase();
  switch (lowerType) {
    case "fire":
      return "#ea580c";
    case "flood":
      return "#2563eb";
    case "warning":
      return "#eab308";
    case "ndvi":
      return "#16a34a";
    default:
      return "#64748b";
  }
}

export function getSeverityColor(severity: string): string {
  const normalized = severity?.toLowerCase();
  if (["high", "critical", "severe", "extreme"].includes(normalized)) {
    return "border-l-red-500 bg-red-500/10";
  }
  if (["medium", "moderate", "warning"].includes(normalized)) {
    return "border-l-orange-500 bg-orange-500/10";
  }
  return "border-l-blue-500 bg-blue-500/10";
}
