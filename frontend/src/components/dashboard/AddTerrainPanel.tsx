"use client";

import { useState, ComponentType, useMemo, useEffect } from "react";
import {
  X,
  Loader2,
  MapPin,
  Euro,
  SquareIcon,
  Search,
  Building2,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreatePropertyRequest, PackageType, Property } from "@/types";
import { createProperty, API_URL } from "@/lib/api";
import { getIndividualUsers } from "@/app/actions/user";
import { useUser } from "@stackframe/stack";
import dynamic from "next/dynamic";


interface PolygonDrawMapProps {
  onPolygonChange: (
    coordinates: { lat: number; lng: number }[],
    area: number,
    center: { lat: number; lng: number } | null,
  ) => void;
  initialPolygon?: { lat: number; lng: number }[];
  existingPolygons?: { coordinates: any; name: string }[];
}

const PolygonDrawMap = dynamic<PolygonDrawMapProps>(
  () => import("@/components/map/PolygonDrawMap").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-900 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-500" />
      </div>
    ),
  },
);

interface CadastralData {
  numar_cadastral: string;
  geometry_type: string;
  coordinates: Array<Array<{ lat: number; lng: number }>>;
  center_lat: number;
  center_lng: number;
  area_ha: number;
  locality: string;
  county: string;
}

interface AddTerrainPanelProps {
  onClose: () => void;
  onSuccess: () => void;
  existingProperties?: Property[];
  assignedUserId?: string;
}

const CROP_TYPES = [
  { value: "grau", label: "Grâu (48 €)" },
  { value: "porumb", label: "Porumb (6.5 €)" },
  { value: "floarea_soarelui", label: "Floarea Soarelui (90 €)" },
  { value: "rapita", label: "Rapiță (140 €)" },
  { value: "orz", label: "Orz (90 €)" },
  { value: "soia", label: "Soia (150 €)" },
  { value: "vie", label: "Vie (120 €)" },
  { value: "livada", label: "Livadă (100 €)" },
  { value: "legume", label: "Legume (150 €)" },
  { value: "altele", label: "Altele (100 €)" },
];

const CROP_PRICES: Record<string, number> = {
  grau: 48,
  porumb: 6.5,
  floarea_soarelui: 90,
  rapita: 140,
  orz: 90,
  soia: 150,
  vie: 120,
  livada: 100,
  legume: 150,
  altele: 100,
};

const getSurfaceTax = (area: number): number | "custom" => {
  if (area < 7) return 10;
  if (area <= 12) return 18;
  if (area <= 20) return 24;
  if (area <= 35) return 34;
  if (area <= 60) return 48;
  if (area <= 100) return 69;
  if (area <= 150) return 92;
  if (area <= 250) return 124;
  if (area <= 400) return 169;
  if (area <= 700) return 239;
  if (area <= 1000) return 329;
  return "custom";
};

const LOADING_MESSAGES = [
  "Se conectează la ANCPI...",
  "Se verifică numărul cadastral...",
  "Se preiau datele geometrice...",
  "Se procesează coordonatele...",
  "Se finalizează preluarea datelor...",
  "Se optimizează datele...",
];

type InputMode = "cadastral" | "draw";

export default function AddTerrainPanel({
  onClose,
  onSuccess,
  existingProperties = [],
  assignedUserId: assignedUserIdProp,
}: AddTerrainPanelProps) {
  const user = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>("cadastral");
  
  const [insuredUsers, setInsuredUsers] = useState<any[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<string>(assignedUserIdProp || "");

  useEffect(() => {
    getIndividualUsers().then(users => {
      setInsuredUsers(users);
      if (users.length > 0) {
        setAssignedUserId(users[0].stack_user_id);
      }
    }).catch(console.error);
  }, []);

  const [numarCadastral, setNumarCadastral] = useState("");
  const [cadastralData, setCadastralData] = useState<CadastralData | null>(
    null,
  );
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [cadastralFetched, setCadastralFetched] = useState(false);

  const [name, setName] = useState("");
  const [cropType, setCropType] = useState("grau");
  const [coordinates, setCoordinates] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [area, setArea] = useState(0);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  const surfaceTax = getSurfaceTax(area);
  const cropFactor = CROP_PRICES[cropType] || 1;
  const estimatedValue = surfaceTax === "custom" ? 0 : surfaceTax * cropFactor;



  const existingPolygonsFormatted = useMemo(() => {
    return existingProperties.map((p) => {
      if (
        !p.geometry ||
        !p.geometry.coordinates ||
        !p.geometry.coordinates[0]
      ) {
        return { coordinates: [], name: p.name };
      }

      const ring = p.geometry.coordinates[0];
      let coords: any = ring;

      if (ring.length > 0) {
        const firstPoint = ring[0];
        // Heuristic: if first component < 40, likely [lng, lat], swap to [lat, lng]
        if (firstPoint[0] < 40) {
          coords = ring.map((c: any) => [c[1], c[0]]);
        }
      }
      return {
        coordinates: [coords],
        name: p.name,
      };
    });
  }, [existingProperties]);



  const handlePolygonChange = (
    coords: { lat: number; lng: number }[],
    calculatedArea: number,
    calculatedCenter: { lat: number; lng: number } | null,
  ) => {
    setCoordinates(coords);
    setArea(calculatedArea);
    setCenter(calculatedCenter);
  };

  const handleCadastralLookup = async () => {
    if (!numarCadastral.trim()) {
      setError("Vă rugăm să introduceți numărul cadastral");
      return;
    }

    setIsLoading(true);
    setError(null);
    setLoadingProgress(0);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = Math.min(prev + 2, 95);
        const messageIndex = Math.floor(
          (newProgress / 100) * LOADING_MESSAGES.length,
        );
        setLoadingMessage(
          LOADING_MESSAGES[Math.min(messageIndex, LOADING_MESSAGES.length - 1)],
        );
        return newProgress;
      });
    }, 50);

    try {
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);

      const response = await fetch(
        `${API_URL}/api/properties/cadastral-lookup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
          },
          body: JSON.stringify({ numar_cadastral: numarCadastral }),
        },
      );

      clearInterval(progressInterval);
      setLoadingProgress(100);
      setLoadingMessage("Date preluate cu succes!");

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!response.ok) {
        throw new Error("Numărul cadastral nu a fost găsit");
      }

      const data = await response.json();
      setCadastralData(data);
      setName(`Teren ${data.locality}`);
      setArea(data.area_ha);
      setCenter({ lat: data.center_lat, lng: data.center_lng });
      if (data.coordinates && data.coordinates[0]) {
        setCoordinates(data.coordinates[0]);
      }
      setCadastralFetched(true);
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err instanceof Error ? err.message : "Eroare la preluarea datelor",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetCadastral = () => {
    setCadastralFetched(false);
    setCadastralData(null);
    setName("");
    setArea(0);
    setCenter(null);
    setCoordinates([]);
    setLoadingProgress(0);
    setLoadingMessage("");
  };

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Numele terenului este obligatoriu");
      return;
    }

    if (inputMode === "draw" && coordinates.length < 3) {
      setError(
        "Selectează cel puțin 3 puncte pe hartă pentru a forma un poligon",
      );
      return;
    }

    if (inputMode === "cadastral" && !cadastralFetched) {
      setError("Preia mai întâi datele cadastrale");
      return;
    }

    if (!center) {
      setError("Eroare la calcularea centrului poligonului");
      return;
    }

    let requestData: CreatePropertyRequest;

    if (inputMode === "cadastral" && cadastralData) {
      requestData = {
        name: name.trim(),
        geometry: {
          type: cadastralData.geometry_type as "Polygon",
          coordinates: cadastralData.coordinates,
        },
        crop_type: cropType,
        area_ha: cadastralData.area_ha,
        center_lat: cadastralData.center_lat,
        center_lng: cadastralData.center_lng,
        estimated_value: estimatedValue,
        activePackage: "Per Raport",
        reportsLeft: 0,
        assigned_user_id: assignedUserId || undefined,
      };
    } else {
      const closedCoords = [...coordinates];
      if (
        closedCoords[0].lat !== closedCoords[closedCoords.length - 1].lat ||
        closedCoords[0].lng !== closedCoords[closedCoords.length - 1].lng
      ) {
        closedCoords.push({ ...closedCoords[0] });
      }

      requestData = {
        name: name.trim(),
        geometry: {
          type: "Polygon",
          coordinates: [closedCoords],
        },
        crop_type: cropType,
        area_ha: area,
        center_lat: center.lat,
        center_lng: center.lng,
        estimated_value: estimatedValue,
        activePackage: "Per Raport",
        reportsLeft: 0,
        assigned_user_id: assignedUserId || undefined,
      };
    }

    // Directly create the property with Basic package, 3 reports
    const directData = {
      ...requestData,
      activePackage: "Basic" as PackageType,
      reportsLeft: 3,
    };
    try {
      setIsLoading(true);
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);
      const createdProperty = await createProperty(
        directData,
        accessToken || undefined,
      );
      if (createdProperty?.id) {
        const subscriptionData = JSON.parse(
          localStorage.getItem("propertySubscriptions") || "{}",
        );
        subscriptionData[createdProperty.id] = {
          activePackage: "Basic",
          reportsLeft: 3,
        };
        localStorage.setItem(
          "propertySubscriptions",
          JSON.stringify(subscriptionData),
        );
      }
      onSuccess();
    } catch (err) {
      console.error("Failed to create property:", err);
      setError("A apărut o eroare la crearea terenului. Încearcă din nou.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* Form Section - Order 2 on mobile (bottom), Order 1 on desktop (left) */}
      <div className="w-full md:w-[400px] h-[55%] md:h-full bg-slate-800 border-t md:border-t-0 md:border-r border-slate-700 flex flex-col order-2 md:order-1">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="h-5 w-5 text-green-500" />
            Adaugă Teren
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-slate-700">
          <button
            type="button"
            onClick={() => {
              setInputMode("cadastral");
              setError(null);
              setCoordinates([]);
              setArea(0);
              setCenter(null);
            }}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              inputMode === "cadastral"
                ? "text-green-500 border-b-2 border-green-500 bg-green-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Nr. Cadastral
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode("draw");
              setError(null);
              resetCadastral();
            }}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              inputMode === "draw"
                ? "text-green-500 border-b-2 border-green-500 bg-green-500/10"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Desenare Hartă
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {inputMode === "cadastral" && !cadastralFetched && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Număr Cadastral
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={numarCadastral}
                    onChange={(e) => setNumarCadastral(e.target.value)}
                    placeholder="ex: 50001"
                    disabled={isLoading}
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
                  />
                  <Button
                    type="button"
                    onClick={handleCadastralLookup}
                    disabled={isLoading || !numarCadastral.trim()}
                    className="bg-green-600 hover:bg-green-700 px-3"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Preia automat datele de la ANCPI
                </p>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-100"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {loadingMessage}
                  </div>
                </div>
              )}
            </div>
          )}

          {inputMode === "cadastral" && cadastralFetched && cadastralData && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-400">
                    Date preluate
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetCadastral}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Schimbă
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 text-xs text-slate-400">
                <span>
                  Nr:{" "}
                  <span className="text-white">
                    {cadastralData.numar_cadastral}
                  </span>
                </span>
                <span>
                  Suprafață:{" "}
                  <span className="text-white">{cadastralData.area_ha} ha</span>
                </span>
                <span>
                  Loc:{" "}
                  <span className="text-white">{cadastralData.locality}</span>
                </span>
                <span>
                  Județ:{" "}
                  <span className="text-white">{cadastralData.county}</span>
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nume Teren *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Parcela Nord"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {insuredUsers.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Alocă Asiguratului
              </label>
              <select
                value={assignedUserId}
                onChange={(e) => setAssignedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Nu aloca (Teren Companie)</option>
                {insuredUsers.map((user) => (
                  <option key={user.stack_user_id} value={user.stack_user_id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Tip Cultură *
            </label>
            <select
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {CROP_TYPES.map((crop) => (
                <option key={crop.value} value={crop.value}>
                  {crop.label}
                </option>
              ))}
            </select>
          </div>

          {inputMode === "draw" && (
            <div className="bg-slate-900/50 rounded-lg p-3 space-y-3">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <SquareIcon className="h-4 w-4 text-green-500" />
                Informații Poligon
              </h3>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Puncte Selectate</span>
                <span className="text-white font-medium">
                  {coordinates.length}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Suprafață Calculată</span>
                <span className="text-white font-medium"></span>
              </div>
            </div>
          )}

          <div className="bg-green-600/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-green-400">
                Preț / lună
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {surfaceTax === "custom" ? "Custom Quote" : `${estimatedValue.toLocaleString()} €`}
            </p>
            {surfaceTax !== "custom" && (
              <p className="text-xs text-slate-400 mt-1">
                Calcul: {cropFactor} (cultură) x {surfaceTax}€ (suprafață {area.toFixed(2)} ha)
              </p>
            )}
          </div>

          {inputMode === "draw" && (
            <div className="text-xs text-slate-500 bg-slate-900/50 rounded-lg p-3">
              <p className="font-medium text-slate-400 mb-1">Instrucțiuni:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Click pe hartă pentru a adăuga puncte</li>
                <li>Minim 3 puncte pentru a forma un poligon</li>
                <li>Click pe un punct existent pentru a-l șterge</li>
                <li>Aria și centrul se calculează automat</li>
              </ul>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <Button
            onClick={handleSubmit}
            disabled={
              isLoading ||
              (inputMode === "draw" && coordinates.length < 3) ||
              (inputMode === "cadastral" && !cadastralFetched)
            }
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se creează...
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4 mr-2" />
                Salvează Teren
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-slate-600 hover:bg-slate-700"
          >
            Anulează
          </Button>
        </div>
      </div>

      {/* Map Section - Order 1 on mobile (top), Order 2 on desktop (right) */}
      <div className="flex-1 relative h-[45%] md:h-full order-1 md:order-2">
        <PolygonDrawMap
          onPolygonChange={handlePolygonChange}
          initialPolygon={cadastralFetched ? coordinates : undefined}
          existingPolygons={existingPolygonsFormatted}
        />
        {inputMode === "cadastral" && !cadastralFetched && (
          <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center">
            <div className="text-center p-6">
              <Building2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-white font-medium">
                Introdu numărul cadastral
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Geometria va fi preluată automat de la ANCPI
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
