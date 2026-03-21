"use client";

import { useState, useEffect, memo } from "react";
import {
  AlertTriangle,
  Flame,
  Droplets,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/types";

interface AlertsPanelProps {
  alerts: Alert[];
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

const getSeverityColor = (severity: string) => {
  const normalizedSeverity = severity?.toLowerCase();
  if (["high", "critical", "severe", "extreme"].includes(normalizedSeverity)) {
    return "border-l-red-500 bg-red-500/10";
  }
  if (["medium", "moderate", "warning"].includes(normalizedSeverity)) {
    return "border-l-orange-500 bg-orange-500/10";
  }
  // Low or unknown
  return "border-l-yellow-500 bg-yellow-500/10";
};

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const LOADING_MESSAGES = [
  "Se inițializează conexiunea satelitară...",
  "Se scanează spectrul infraroșu...",
  "Se analizează datele meteorologice...",
  "Se corelează cu senzorii la sol...",
  "Se finalizează raportul de alerte...",
];

function AlertsPanel({ alerts }: AlertsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    let progress = 0;
    const intervalTime = 50; // Update every 50ms
    const totalTime = 5000; // 5 seconds total
    const steps = totalTime / intervalTime;
    const increment = 100 / steps;

    const interval = setInterval(() => {
      progress += increment;
      if (progress >= 100) {
        clearInterval(interval);
        setIsLoading(false);
      } else {
        setLoadingProgress(Math.min(progress, 100));
        const messageIndex = Math.floor(
          (progress / 100) * LOADING_MESSAGES.length,
        );
        setLoadingMessage(
          LOADING_MESSAGES[Math.min(messageIndex, LOADING_MESSAGES.length - 1)],
        );
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, []);

  // Sort alerts by date descending (newest first)
  const sortedAlerts = [...alerts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const displayedAlerts = sortedAlerts.slice(0, 3);
  const hiddenAlerts = sortedAlerts.slice(3);
  const hasMore = hiddenAlerts.length > 0;

  return (
    <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Alerte Active
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {isLoading ? (
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-75 ease-linear"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin text-green-500" />
                <span className="animate-pulse">{loadingMessage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 justify-center pt-2">
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Se caută...
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {displayedAlerts.map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}

            <div
              className={`space-y-2 overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              {hiddenAlerts.map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>

            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full text-slate-400 hover:text-white hover:bg-slate-700/50 mt-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-2" />
                    Arată mai puțin
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Arată mai multe ({hiddenAlerts.length})
                  </>
                )}
              </Button>
            )}

            {alerts.length === 0 && (
              <div className="text-center py-6 text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nicio alertă activă</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AlertItem({ alert }: { alert: Alert }) {
  return (
    <div
      className={`border-l-4 rounded-r-lg p-3 ${getSeverityColor(
        alert.severity,
      )}`}
    >
      <div className="flex items-start gap-2">
        {getAlertIcon(alert.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate">
            {alert.message}
          </p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>{alert.sector}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatTime(alert.timestamp)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(AlertsPanel);
