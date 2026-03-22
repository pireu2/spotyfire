"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import { MapPin, Euro, SquareIcon, RefreshCw, Trash2, User } from "lucide-react";

const PACKAGE_REPORTS: Record<string, number> = {
  Basic: 3,
  Pro: 15,
  Enterprise: 30,
};

export default function TerenCard({
  property,
  onRenew,
  onDelete,
  ownerName,
}: {
  property: any;
  onRenew: () => void;
  onDelete: () => void;
  ownerName?: string;
}) {
  const {
    name,
    crop_type,
    area_ha,
    estimated_value,
    center_lat,
    center_lng,
    risk_score,
    activePackage,
    reportsLeft,
  } = property;
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-green-500/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-sm text-slate-400">{crop_type}</p>
          {ownerName && (
            <div className="flex items-center gap-1.5 mt-1">
              <User className="h-3 w-3 text-green-400" />
              <span className="text-xs text-green-400 font-medium">{ownerName}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Șterge Teren"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <SquareIcon className="h-4 w-4" />
            <span>Suprafață</span>
          </div>
          <span className="text-white font-medium">
            {area_ha.toFixed(2)} ha
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <Euro className="h-4 w-4" />
            <span>Preț / lună</span>
          </div>
          <span className="text-white font-medium">
            {estimated_value > 0 ? `${estimated_value.toLocaleString()} €` : "Custom Quote"}
          </span>
        </div>

      </div>
      <div className="mt-4 pt-3 border-t border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-slate-500">Rapoarte rămase</span>
          <span className="text-xs font-bold text-green-400">
            {reportsLeft} / {PACKAGE_REPORTS[activePackage] || 3}
          </span>
        </div>
        {reportsLeft === 0 && (
          <div className="flex flex-col items-center gap-2 mt-2">
            <span className="text-xs text-red-500 font-semibold">
              Numărul de rapoarte a fost epuizat.
            </span>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={onRenew}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Reînnoiește
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

