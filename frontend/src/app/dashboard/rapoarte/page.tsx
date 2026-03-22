"use client";

import { useState, useEffect } from "react";
import { useUser } from "@stackframe/stack";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Eye,
  AlertCircle,
  Loader2,
  MapPin,
  CheckCircle,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";

const AnalysisDetailModal = dynamic(
  () => import("@/components/dashboard/AnalysisDetailModal"),
  {
    ssr: false,
  }
);

interface Analysis {
  id: string;
  damage_percent: number;
  damaged_area_ha: number;
  estimated_cost: number;
  date_range_start: string;
  date_range_end: string;
  created_at: string;
}

interface Property {
  id: string;
  name: string;
  crop_type: string;
  assigned_user_id?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ReportsPage() {
  const user = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [analyses, setAnalyses] = useState<{ [key: string]: Analysis[] }>({});
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<{
    id: string;
    propertyName: string;
  } | null>(null);
  const [accessToken, setAccessToken] = useState<string>("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const [selectedPropertyForReport, setSelectedPropertyForReport] =
    useState<string>("");
  const [reportProgress, setReportProgress] = useState(0);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPropertiesAndAnalyses();
    fetchUserRole();
    fetchOwnerMap();
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const meta = (user as any)?.clientMetadata;
      if (meta?.role) {
        setUserRole(meta.role);
      }
    } catch (e) {
      console.error("Failed to get role:", e);
    }
  };

  const fetchOwnerMap = async () => {
    try {
      const res = await fetch("/api/auth/insured-users");
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, string> = {};
        for (const u of data) {
          map[u.stack_user_id] = u.name || u.email;
        }
        setOwnerMap(map);
      }
    } catch (e) {
      console.error("Failed to fetch owner map:", e);
    }
  };

  const loadPropertiesAndAnalyses = async () => {
    try {
      const token = await user?.getAuthJson();
      const accessToken = token?.accessToken;

      if (!accessToken) return;

      setAccessToken(accessToken);

      const propertiesResponse = await fetch(`${API_URL}/api/properties`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!propertiesResponse.ok) throw new Error("Failed to load properties");

      const propertiesData = await propertiesResponse.json();
      setProperties(propertiesData);

      const analysesMap: { [key: string]: Analysis[] } = {};

      for (const property of propertiesData) {
        const analysesResponse = await fetch(
          `${API_URL}/api/properties/${property.id}/analyses`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );

        if (analysesResponse.ok) {
          const analysesData = await analysesResponse.json();
          analysesMap[property.id] = analysesData;
        }
      }

      setAnalyses(analysesMap);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedPropertyForReport || !incidentDate) {
      return;
    }

    setGeneratingReport(true);
    setReportProgress(0);
    setReportSuccess(false);
    setReportError(null);

    try {
      const token = await user?.getAuthJson();
      const accessToken = token?.accessToken;

      if (!accessToken) return;

      setReportProgress(20);

      setReportProgress(40);

      const response = await fetch(
        `${API_URL}/api/properties/${selectedPropertyForReport}/analyze`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            incident_date: incidentDate,
            cost_per_ha: 5000,
          }),
        }
      );

      setReportProgress(70);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        if (response.status === 429) {
          setReportError(errorData?.detail || "Limita de 3 rapoarte pe lună a fost atinsă. Trebuie să reînnoiești polița.");
        } else {
          setReportError(errorData?.detail || "A apărut o eroare la generarea raportului.");
        }
        setReportProgress(0);
        setGeneratingReport(false);
        return;
      }

      setReportProgress(90);
      await loadPropertiesAndAnalyses();
      setReportProgress(100);
      setReportSuccess(true);
      setSelectedPropertyForReport("");
      setIncidentDate("");

      setTimeout(() => {
        setReportSuccess(false);
        setReportProgress(0);
      }, 3000);
    } catch (error: any) {
      console.error("Error generating report:", error);
      setReportError("A apărut o eroare la generarea raportului. Încearcă din nou.");
      setReportProgress(0);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadReport = async (
    analysisId: string,
    propertyName: string
  ) => {
    setDownloadingId(analysisId);
    try {
      const token = await user?.getAuthJson();
      const accessToken = token?.accessToken;

      if (!accessToken) return;

      const response = await fetch(
        `${API_URL}/api/analyses/${analysisId}/report`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
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
      setDownloadingId(null);
    }
  };

  const handleViewOverlay = async (analysisId: string) => {
    try {
      const token = await user?.getAuthJson();
      const accessToken = token?.accessToken;

      if (!accessToken) return;

      const response = await fetch(
        `${API_URL}/api/analyses/${analysisId}/overlay`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!response.ok) throw new Error("Failed to load overlay");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (error) {
      console.error("Error viewing overlay:", error);
      alert("Eroare la vizualizarea overlay-ului");
    }
  };

  const totalAnalyses = Object.values(analyses).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  const isCompany = userRole === "company";

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Rapoarte Analiză Satelit
          </h1>
          <p className="text-slate-400 text-sm">
            {isCompany
              ? "Vizualizează rapoartele de analiză ale persoanelor asigurate"
              : "Analizează deteriorarea terenurilor pe baza unei date de incident"}
          </p>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl px-6 py-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider">
            Total Analize
          </p>
          <p className="text-2xl font-bold text-green-400">{totalAnalyses}</p>
        </div>
      </div>

      {/* Generate Report Form - only for individuals, NOT for companies */}
      {!isCompany && properties.length > 0 && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">
              Generează Raport Nou
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-sm text-slate-400 mb-2">
                    Selectează Teren
                  </label>
                  <select
                    value={selectedPropertyForReport}
                    onChange={(e) =>
                      setSelectedPropertyForReport(e.target.value)
                    }
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2"
                    disabled={generatingReport}
                  >
                    <option value="">Selectează teren...</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} ({property.crop_type || "Necunoscut"})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Data Incident
                  </label>
                  <input
                    type="date"
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2"
                    disabled={generatingReport}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handleGenerateReport}
                    disabled={
                      !selectedPropertyForReport ||
                      !incidentDate ||
                      generatingReport
                    }
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {generatingReport ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generare...
                      </>
                    ) : (
                      <>
                        <FileText className="h-4 w-4 mr-2" />
                        Generează Raport
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Lasă datele goale pentru perioada prestabilită (ultimele 60
                zile, sfârșit 7 zile în urmă - pentru date satelit disponibile)
              </p>

              {generatingReport && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Procesare analiză satelit...
                    </span>
                    <span className="text-green-400 font-semibold">
                      {reportProgress}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-linear-to-r from-green-600 to-green-400 h-full transition-all duration-500 ease-out"
                      style={{ width: `${reportProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    {reportProgress < 40 && "Inițializare analiză..."}
                    {reportProgress >= 40 &&
                      reportProgress < 70 &&
                      "Procesare imagini satelit..."}
                    {reportProgress >= 70 &&
                      reportProgress < 100 &&
                      "Calculare deteriorare..."}
                    {reportProgress === 100 && "Finalizare..."}
                  </p>
                </div>
              )}

              {reportSuccess && (
                <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Raport generat cu succes! Verifică lista de mai jos.
                  </span>
                </div>
              )}

              {reportError && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{reportError}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-green-500" />
        </div>
      ) : totalAnalyses === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="pt-12 pb-12">
            <div className="text-center text-slate-400">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg mb-2">Nu există analize disponibile</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {properties.map((property) => {
            const propertyAnalyses = analyses[property.id] || [];
            if (propertyAnalyses.length === 0) return null;

            const ownerName = property.assigned_user_id
              ? ownerMap[property.assigned_user_id]
              : null;

            return (
              <Card
                key={property.id}
                className="bg-slate-800/50 border-slate-700"
              >
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-500" />
                    {property.name}
                    <span className="text-sm text-slate-400 font-normal ml-2">
                      ({property.crop_type || "Necunoscut"})
                    </span>
                    {ownerName && (
                      <span className="flex items-center gap-1 text-sm font-normal ml-auto bg-green-900/30 text-green-400 border border-green-800/50 rounded-full px-3 py-0.5">
                        <User className="h-3.5 w-3.5" />
                        {ownerName}
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {propertyAnalyses.map((analysis) => (
                      <div
                        key={analysis.id}
                        className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
                          <div className="flex-1 w-full">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              <span className="text-white font-medium">
                                Analiză{" "}
                                {new Date(
                                  analysis.created_at
                                ).toLocaleDateString("ro-RO")}
                              </span>
                              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 whitespace-nowrap">
                                {analysis.date_range_start} →{" "}
                                {analysis.date_range_end}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 text-sm">
                              <div>
                                <span className="text-slate-400">
                                  Deteriorare:
                                </span>
                                <span className="text-red-400 font-semibold ml-2">
                                  {analysis.damage_percent?.toFixed(2)}%
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  Zonă afectată:
                                </span>
                                <span className="text-orange-400 font-semibold ml-2">
                                  {analysis.damaged_area_ha?.toFixed(2)} ha
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400">
                                  Cost estimat:
                                </span>
                                <span className="text-yellow-400 font-semibold ml-2">
                                  {analysis.estimated_cost?.toLocaleString()}{" "}
                                  RON
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full md:w-auto md:ml-4 overflow-x-auto pb-1 md:pb-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 md:flex-none"
                              onClick={() =>
                                setSelectedAnalysis({
                                  id: analysis.id,
                                  propertyName: property.name,
                                })
                              }
                            >
                              <MapPin className="h-4 w-4 mr-1" />
                              Hartă
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 flex-1 md:flex-none"
                              onClick={() => handleViewOverlay(analysis.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Overlay
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                              onClick={() =>
                                handleDownloadReport(analysis.id, property.name)
                              }
                              disabled={downloadingId === analysis.id}
                            >
                              {downloadingId === analysis.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4 mr-1" />
                              )}
                              PDF
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selectedAnalysis && (
        <AnalysisDetailModal
          analysisId={selectedAnalysis.id}
          propertyName={selectedAnalysis.propertyName}
          accessToken={accessToken}
          onClose={() => setSelectedAnalysis(null)}
        />
      )}
    </div>
  );
}

