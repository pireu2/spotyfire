"use client";

import { AlertTriangle, Flame, Droplets } from "lucide-react";
import { Alert } from "@/types";
import { Formatter } from "@/utils/formatter";

interface AlertItemProps {
  alert: Alert;
}

const getAlertIcon = (type: Alert["type"]) => {
  switch (type) {
    case "fire":
      return <Flame className="h-4 w-4 text-orange-500" />;
    case "flood":
      return <Droplets className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
};

export default function AlertItem({ alert }: AlertItemProps) {
  const severityColor = Formatter.getSeverityColor(alert.severity);

  return (
    <div className={`border-l-4 p-3 ${severityColor}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">{getAlertIcon(alert.type)}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">{alert.message}</p>
          <p className="text-xs text-slate-400 mt-1">
            Sector: {alert.sector} • {Formatter.formatTime(alert.timestamp)}
          </p>
        </div>
      </div>
    </div>
  );
}
