"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Loader2 } from "lucide-react";

import MapWrapper from "@/components/map/MapWrapper";
import MapLayers from "@/components/map/MapLayers";
import HealthStats from "@/components/dashboard/HealthStats";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import ClaimsCard from "@/components/dashboard/ClaimsCard";
import AiAssistant from "@/components/dashboard/AiAssistant";
import { Button } from "@/components/ui/button";

import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useAlerts } from "@/hooks/useAlerts";
import { calculateAverageNDVI } from "@/utils/property.utils";
import { mockNDVIData } from "@/lib/mocks";
import type { LandParcel } from "@/types";

export default function DashboardPage() {
  const { userId, accessToken, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeLayer, setActiveLayer] = useState("standard");
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);

  const { parcels, isLoading: loadingProperties } = useProperties(userId, accessToken);
  const { alerts } = useAlerts();

  const currentNDVI = useMemo(() => calculateAverageNDVI(parcels), [parcels]);

  const handleParcelSelect = useCallback((parcel: LandParcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleLayerChange = useCallback((layer: string) => {
    setActiveLayer(layer);
  }, []);

  if (authLoading || loadingProperties) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (parcels.length === 0) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <MapPin className="h-20 w-20 text-slate-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Nu ai terenuri înregistrate
          </h2>
          <p className="text-slate-400 mb-6">
            Pentru a vedea harta live cu terenurile tale, trebuie mai întâi să
            adaugi cel puțin un teren.
          </p>
          <Link
            href="/dashboard/terenuri"
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
          >
            <MapPin className="h-5 w-5" />
            Adaugă Primul Teren
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-auto md:h-[calc(100vh-4rem)] p-4 flex flex-col md:flex-row gap-4 overflow-y-auto md:overflow-hidden">
      <div className="w-full md:flex-1 h-[400px] md:h-auto relative rounded-xl overflow-hidden border border-slate-700 shrink-0">
        <MapWrapper
          key="main-map"
          parcels={parcels}
          alerts={alerts}
          activeLayer={activeLayer}
          onParcelSelect={handleParcelSelect}
        />
        <MapLayers activeLayer={activeLayer} onLayerChange={handleLayerChange} />

        {selectedParcel && (
          <div className="absolute top-4 left-4 right-16 z-[500] bg-slate-900/90 backdrop-blur px-4 py-3 rounded-lg border border-slate-700 shadow-xl animate-in slide-in-from-top-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                  Teren Selectat
                </p>
                <h3 className="font-bold text-white text-lg">
                  {selectedParcel.name}
                </h3>
                <p className="text-sm text-slate-300">
                  Status:{" "}
                  <span
                    className={
                      selectedParcel.status === "healthy"
                        ? "text-green-400"
                        : "text-orange-400"
                    }
                  >
                    {selectedParcel.status}
                  </span>
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 rounded-full hover:bg-slate-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedParcel(null);
                }}
              >
                <span className="sr-only">Close</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </Button>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-xs text-slate-300">Sănătos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-xs text-slate-300">Incendiu</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-xs text-slate-300">Inundație</span>
          </div>
        </div>
      </div>

      <div className="w-full md:w-80 space-y-4 md:overflow-y-auto">
        <HealthStats data={mockNDVIData} currentNDVI={currentNDVI} />
        <AlertsPanel alerts={alerts} />
        <ClaimsCard parcels={parcels} />
      </div>

      <AiAssistant />
    </div>
  );
}
