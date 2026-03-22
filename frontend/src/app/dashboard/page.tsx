"use client";

import { useState, useCallback, useMemo } from "react";
import { Loader2 } from "lucide-react";
import MapWrapper from "@/components/map/MapWrapper";
import MapLayers from "@/components/map/MapLayers";
import MapLegend from "@/components/map/MapLegend";
import HealthStats from "@/components/dashboard/HealthStats";
import AlertsPanel from "@/components/dashboard/AlertsPanel";
import ClaimsCard from "@/components/dashboard/ClaimsCard";
import AiAssistant from "@/components/dashboard/AiAssistant";
import SelectedParcelInfo from "@/components/dashboard/SelectedParcelInfo";
import EmptyPropertiesState from "@/components/dashboard/EmptyPropertiesState";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { useAlerts } from "@/hooks/useAlerts";
import { calculateAverageNDVI } from "@/utils/property.utils";
import { mockNDVIData } from "@/lib/mocks";
import type { LandParcel } from "@/types";

import { useEffect } from "react";
import { getCurrentUserRole } from "@/app/actions/user";

export default function DashboardPage() {
  const { userId, accessToken, isLoading: authLoading } = useAuth();
  const [activeLayer, setActiveLayer] = useState("standard");
  const [selectedParcel, setSelectedParcel] = useState<LandParcel | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUserRole().then(r => setRole(r));
  }, []);

  const { parcels, isLoading: loadingProperties } = useProperties(
    userId,
    accessToken,
  );
  const { alerts } = useAlerts(accessToken);

  const currentNDVI = useMemo(() => calculateAverageNDVI(parcels), [parcels]);

  const handleParcelSelect = useCallback((parcel: LandParcel) => {
    setSelectedParcel(parcel);
  }, []);

  const handleLayerChange = useCallback((layer: string) => {
    setActiveLayer(layer);
  }, []);

  if (authLoading || loadingProperties || role === null) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    );
  }

  if (parcels.length === 0) {
    return <EmptyPropertiesState role={role} />;
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
        <MapLayers
          activeLayer={activeLayer}
          onLayerChange={handleLayerChange}
        />
        {selectedParcel && (
          <SelectedParcelInfo
            parcel={selectedParcel}
            onClose={() => setSelectedParcel(null)}
          />
        )}
        <MapLegend />
      </div>

      <div className="w-full md:w-80 space-y-4 md:overflow-y-auto">
        {role !== "individual" && <HealthStats data={mockNDVIData} currentNDVI={currentNDVI} />}
        {role !== "individual" && <AlertsPanel alerts={alerts} />}
        <ClaimsCard parcels={parcels} />
      </div>

      {role !== "individual" && <AiAssistant />}
    </div>
  );
}
