"use client";

const LOADING_MESSAGES = [
  "Se inițializează conexiunea satelitară...",
  "Se scanează spectrul infraroșu...",
  "Se analizează datele meteorologice...",
  "Se corelează cu senzorii la sol...",
  "Se finalizează raportul de alerte...",
];

interface AlertsLoadingStateProps {
  progress: number;
  message: string;
}

export default function AlertsLoadingState({
  progress,
  message,
}: AlertsLoadingStateProps) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <p className="text-sm text-slate-300 mb-2">{message}</p>
        <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-green-500 h-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">
        {Math.round(progress)}%
      </p>
    </div>
  );
}
