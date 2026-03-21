"use client";

import { LandParcel } from "@/types";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Formatter } from "@/utils/formatter";

interface SelectedParcelInfoProps {
  parcel: LandParcel;
  onClose: () => void;
}

export default function SelectedParcelInfo({
  parcel,
  onClose,
}: SelectedParcelInfoProps) {
  const statusLabel = Formatter.getHealthStatusLabel(parcel.status);
  const statusColor = Formatter.getHealthStatusColor(parcel.status);

  return (
    <div className="absolute top-4 left-4 right-16 z-500 bg-slate-900/90 backdrop-blur px-4 py-3 rounded-lg border border-slate-700 shadow-xl animate-in slide-in-from-top-2">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
            Teren Selectat
          </p>
          <h3 className="font-bold text-white text-lg">{parcel.name}</h3>
          <p className="text-sm text-slate-300">
            Status: <span className={statusColor}>{statusLabel}</span>
          </p>
          {parcel.damageEstimate && (
            <p className="text-sm text-slate-300">
              Estimare daune:{" "}
              <span className="text-orange-400">
                {Formatter.formatCurrency(parcel.damageEstimate)}
              </span>
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full hover:bg-slate-800"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
