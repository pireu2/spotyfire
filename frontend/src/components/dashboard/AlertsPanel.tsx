"use client";

import { useState, useEffect, memo } from "react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert } from "@/types";
import AlertList from "./AlertList";
import AlertsLoadingState from "./AlertsLoadingState";

interface AlertsPanelProps {
  alerts: Alert[];
}

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
    const intervalTime = 50;
    const totalTime = 5000;
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
          <AlertsLoadingState
            progress={loadingProgress}
            message={loadingMessage}
          />
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AlertList alerts={displayedAlerts} />

            <div
              className={`space-y-2 overflow-hidden transition-all duration-500 ease-in-out ${
                isExpanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <AlertList alerts={hiddenAlerts} />
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

export default memo(AlertsPanel);
