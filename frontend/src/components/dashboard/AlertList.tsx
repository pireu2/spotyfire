"use client";

import { Alert } from "@/types";
import AlertItem from "./AlertItem";

interface AlertListProps {
  alerts: Alert[];
}

export default function AlertList({ alerts }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-slate-400">Nu sunt alerte în acest moment</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
