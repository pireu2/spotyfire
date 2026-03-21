"use client";

import { useState, useEffect, memo } from "react";
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LandParcel } from "@/types";
import {
  getPropertySubscription,
  decrementPropertyReports,
} from "@/lib/propertySubscription";
import Link from "next/link";

interface ClaimsCardProps {
  parcels: LandParcel[];
}

function ClaimsCard({ parcels }: ClaimsCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportsAvailable, setReportsAvailable] = useState(true);
  const [totalReportsLeft, setTotalReportsLeft] = useState(0);

  const damagedParcels = parcels.filter((p) => p.status !== "healthy");
  const totalDamage = damagedParcels.reduce(
    (acc, p) => acc + (p.damageEstimate || 0),
    0,
  );
  const totalArea = damagedParcels.reduce((acc, p) => acc + p.area, 0);

  // Check reports availability on mount and when parcels change
  useEffect(() => {
    if (typeof window === "undefined") return;

    let totalLeft = 0;
    damagedParcels.forEach((parcel) => {
      const subscription = getPropertySubscription(parcel.id);
      if (subscription) {
        totalLeft += subscription.reportsLeft;
      } else if (parcel.reportsLeft !== undefined) {
        totalLeft += parcel.reportsLeft;
      }
    });

    setTotalReportsLeft(totalLeft);
    setReportsAvailable(totalLeft > 0);
  }, [parcels, damagedParcels, reportGenerated]);

  const handleGenerateReport = async () => {
    // Find a parcel with reports remaining
    const parcelWithReports = damagedParcels.find((p) => {
      const sub = getPropertySubscription(p.id);
      return (
        (sub && sub.reportsLeft > 0) || (p.reportsLeft && p.reportsLeft > 0)
      );
    });

    if (!parcelWithReports) {
      setReportsAvailable(false);
      return;
    }

    setIsGenerating(true);

    // Simulate report generation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Decrement reports for the selected parcel
    const decremented = decrementPropertyReports(parcelWithReports.id);

    // Update local state
    if (decremented) {
      setTotalReportsLeft((prev) => Math.max(0, prev - 1));
    }

    setIsGenerating(false);
    setReportGenerated(true);
  };

  return (
    <Card className="bg-slate-800/80 backdrop-blur border-slate-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-green-500" />
          Raport Despăgubiri
        </CardTitle>
      </CardHeader>
      <CardContent>
        {damagedParcels.length > 0 ? (
          <>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Parcele Afectate</span>
                <span className="text-white font-semibold">
                  {damagedParcels.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Suprafață Totală</span>
                <span className="text-white font-semibold">
                  {totalArea.toFixed(1)} ha
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Estimare Daune</span>
                <span className="text-red-400 font-bold text-lg">
                  {totalDamage.toLocaleString("ro-RO")} RON
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">
                  Rapoarte Disponibile
                </span>
                <span
                  className={`font-semibold ${totalReportsLeft > 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {totalReportsLeft}
                </span>
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              {!reportsAvailable ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <span className="font-medium text-sm">
                      Nu mai ai rapoarte disponibile
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Trebuie să îți reînnoiești abonamentul pentru a genera
                    rapoarte noi.
                  </p>
                  <Link href="/dashboard/terenuri">
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Reînnoiește Abonamentul
                    </Button>
                  </Link>
                </div>
              ) : reportGenerated ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Raport Generat</span>
                  </div>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Descarcă Certificat PDF
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Se Generează...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generează Raport AI
                    </>
                  )}
                </Button>
              )}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3 w-3" />
              <span>Timp estimat generare: &lt;1 minut</span>
            </div>
          </>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500 opacity-50" />
            <p>Nicio daună detectată</p>
            <p className="text-xs mt-1">Toate parcelele sunt sănătoase</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(ClaimsCard);
