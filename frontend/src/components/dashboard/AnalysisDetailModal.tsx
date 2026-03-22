"use client";

import { useState, useEffect } from "react";
import { X, Download, Loader2, TrendingDown, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";

const ReportMapView = dynamic(() => import("@/components/map/ReportMapView"), {
  ssr: false,
  loading: () => (
    <div className="h-400px bg-slate-900/50 rounded-lg border border-slate-800 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-500" />
    </div>
  ),
});

interface AnalysisDetailModalProps {
  analysisId: string;
  propertyName: string;
  accessToken: string;
  onClose: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalysisDetail {
  id: string;
  damage_percent: number;
  damaged_area_ha: number;
  estimated_cost: number;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
  ndvi_before?: number;
  ndvi_after?: number;
  analysis_type: string;
}

interface PropertyDetail {
  id: string;
  name: string;
  crop_type: string;
  geometry: any;
  area_ha: number;
}

export default function AnalysisDetailModal({
  analysisId,
  propertyName,
  accessToken,
  onClose,
}: AnalysisDetailModalProps) {
  const [analysis, setAnalysis] = useState<AnalysisDetail | null>(null);
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    loadAnalysisDetails();
  }, [analysisId]);

  const loadAnalysisDetails = async () => {
    try {
      const analysisResponse = await fetch(
        `${API_URL}/api/analyses/${analysisId}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!analysisResponse.ok) throw new Error("Failed to load analysis");

      const analysisData = await analysisResponse.json();
      setAnalysis(analysisData);

      const propertyResponse = await fetch(
        `${API_URL}/api/properties/${analysisData.property_id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (propertyResponse.ok) {
        const propertyData = await propertyResponse.json();
        setProperty(propertyData);
      }
    } catch (error) {
      console.error("Error loading analysis details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/analyses/${analysisId}/report`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) throw new Error("Failed to download report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `raport_${propertyName.replace(/\s/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading report:", error);
      alert("Eroare la descărcarea raportului");
    } finally {
      setDownloading(false);
    }
  };

  const ndviChange =
    analysis?.ndvi_before && analysis?.ndvi_after
      ? analysis.ndvi_after - analysis.ndvi_before
      : null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{propertyName}</h2>
            <p className="text-sm text-slate-400">
              Analiză satelit{" "}
              {analysis
                ? new Date(analysis.created_at).toLocaleDateString("ro-RO")
                : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDownloadReport}
              disabled={downloading}
              className="bg-green-600 hover:bg-green-700"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Descarcă PDF
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Tip Cultură
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {property?.crop_type || "Necunoscut"}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Suprafață Totală
                  </p>
                  <p className="text-lg font-semibold text-white">
                    {property?.area_ha?.toFixed(2)} ha
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Perioadă Analiză
                  </p>
                  <p className="text-sm font-semibold text-orange-400">
                    {analysis?.date_range_start} → {analysis?.date_range_end}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
                    Tip Analiză
                  </p>
                  <p className="text-lg font-semibold text-white capitalize">
                    {analysis?.analysis_type}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-xs text-red-400 uppercase tracking-wider mb-1">
                    Deteriorare
                  </p>
                  <p className="text-2xl font-bold text-red-400">
                    {analysis?.damage_percent?.toFixed(2)}%
                  </p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                  <p className="text-xs text-orange-400 uppercase tracking-wider mb-1">
                    Zonă Afectată
                  </p>
                  <p className="text-2xl font-bold text-orange-400">
                    {analysis?.damaged_area_ha?.toFixed(2)} ha
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p className="text-xs text-yellow-400 uppercase tracking-wider mb-1">
                    Cost Estimat
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {analysis?.estimated_cost?.toLocaleString()} RON
                  </p>
                </div>
              </div>

              {analysis?.ndvi_before !== undefined &&
                analysis?.ndvi_before !== null &&
                analysis?.ndvi_after !== undefined &&
                analysis?.ndvi_after !== null && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-3">
                      Indice Vegetație (NDVI)
                    </p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Înainte</p>
                        <p className="text-lg font-bold text-green-400">
                          {analysis.ndvi_before.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">După</p>
                        <p className="text-lg font-bold text-blue-400">
                          {analysis.ndvi_after.toFixed(3)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Schimbare</p>
                        <div className="flex items-center gap-1">
                          {ndviChange !== null && ndviChange < 0 ? (
                            <TrendingDown className="h-4 w-4 text-red-400" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-green-400" />
                          )}
                          <p
                            className={`text-lg font-bold ${
                              ndviChange !== null && ndviChange < 0
                                ? "text-red-400"
                                : "text-green-400"
                            }`}
                          >
                            {ndviChange !== null
                              ? ndviChange.toFixed(3)
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {property?.geometry && (
                <div>
                  <p className="text-sm text-slate-400 mb-3">
                    Hartă Deteriorare
                  </p>
                  <ReportMapView
                    geometry={property.geometry}
                    analysisId={analysisId}
                    accessToken={accessToken}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    * Overlay-ul roșu indică zonele cu deteriorare detectată
                    prin analiză satelit
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
