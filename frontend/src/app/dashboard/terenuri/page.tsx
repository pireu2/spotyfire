"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Loader2,
  Trash2,
  Wheat,
  Trees,
  Grape,
  MapPin,
  Euro,
  SquareIcon,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageType, Property } from "@/types";
import { getProperties, deleteProperty } from "@/lib/api";
import { useUser } from "@stackframe/stack";
import AddTerrainPanel from "@/components/dashboard/AddTerrainPanel";
import TerenCard from "@/components/dashboard/TerenCard";
import Link from "next/link";

const getCropIcon = (cropType: string) => {
  switch (cropType.toLowerCase()) {
    case "grau":
    case "wheat":
    case "porumb":
    case "corn":
      return <Wheat className="h-6 w-6" />;
    case "vie":
    case "grape":
      return <Grape className="h-6 w-6" />;
    default:
      return <Trees className="h-6 w-6" />;
  }
};

const getCropLabel = (cropType: string) => {
  const labels: Record<string, string> = {
    grau: "Grâu",
    porumb: "Porumb",
    floarea_soarelui: "Floarea Soarelui",
    rapita: "Rapiță",
    orz: "Orz",
    soia: "Soia",
    vie: "Vie",
    livada: "Livadă",
    legume: "Legume",
    altele: "Altele",
  };
  return labels[cropType.toLowerCase()] || cropType;
};

import DeleteConfirmationModal from "@/components/dashboard/DeleteConfirmationModal";

const isPackageType = (value: string): value is PackageType => {
  return (
    value === "Basic" ||
    value === "Pro" ||
    value === "Enterprise" ||
    value === "Per Raport"
  );
};

export default function TerenuriPage() {
  const user = useUser();
  const searchParams = useSearchParams();
  const assignTo = searchParams.get("assignTo");
  
  const [properties, setProperties] = useState<Property[]>([]);
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [ownerMap, setOwnerMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // New state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(
    null,
  );

  const PACKAGE_REPORTS: Record<PackageType, number> = {
    Basic: 3,
    Pro: 15,
    Enterprise: 30,
    "Per Raport": 0,
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

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);
      let data = await getProperties(accessToken || undefined);

      // Get locally stored subscription info (since backend may not persist it)
      const savedSubscriptions = JSON.parse(
        localStorage.getItem("propertySubscriptions") || "{}",
      );

      // Merge API data with localStorage subscription info
      let propertiesWithReports = data.map((p) => {
        const savedSub = savedSubscriptions[p.id];
        const savedPackage = savedSub?.activePackage;
        const activePackage: PackageType = isPackageType(savedPackage)
          ? savedPackage
          : p.activePackage || "Basic";
        const reportsLeft =
          savedSub?.reportsLeft ??
          p.reportsLeft ??
          PACKAGE_REPORTS[activePackage] ??
          3;

        return {
          ...p,
          activePackage,
          reportsLeft,
        };
      });

      // Store all properties (unfiltered) for the map
      setAllProperties(propertiesWithReports);

      // If filtering by assignTo, show only that user's properties in the list
      let filtered = propertiesWithReports;
      if (assignTo) {
        filtered = propertiesWithReports.filter(
          (p) => p.assigned_user_id === assignTo
        );
      }

      // Sort by owner (assigned_user_id) so properties are grouped by person
      filtered.sort((a, b) => {
        const ownerA = a.assigned_user_id || "";
        const ownerB = b.assigned_user_id || "";
        return ownerA.localeCompare(ownerB);
      });

      setProperties(filtered);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
      fetchOwnerMap();
    }
  }, [user, assignTo]);

  const handleDeleteClick = (property: Property) => {
    setPropertyToDelete(property);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!propertyToDelete) return;

    try {
      setDeletingId(propertyToDelete.id);
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);
      await deleteProperty(propertyToDelete.id, accessToken || undefined);
      setProperties((prev) => prev.filter((p) => p.id !== propertyToDelete.id));
      setShowDeleteConfirm(false);
      setPropertyToDelete(null);
    } catch (error) {
      console.error("Failed to delete property:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRenew = (property: Property) => {
    // Directly renew to Basic with 3 reports
    const subscriptionData = JSON.parse(
      localStorage.getItem("propertySubscriptions") || "{}",
    );
    subscriptionData[property.id] = {
      activePackage: "Basic",
      reportsLeft: 3,
    };
    localStorage.setItem(
      "propertySubscriptions",
      JSON.stringify(subscriptionData),
    );

    setProperties((prev) =>
      prev.map((p) =>
        p.id === property.id
          ? { ...p, activePackage: "Basic" as PackageType, reportsLeft: 3 }
          : p,
      ),
    );
  };

  const handleAddSuccess = () => {
    fetchProperties();
    setShowAddPanel(false);
  };

  const assignToName = assignTo ? (ownerMap[assignTo] || assignTo) : null;

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {showAddPanel ? (
        <AddTerrainPanel
          onClose={() => setShowAddPanel(false)}
          onSuccess={handleAddSuccess}
          existingProperties={allProperties}
          assignedUserId={assignTo || undefined}
        />
      ) : (
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Banner when filtering by person */}
          {assignTo && (
            <div className="mb-4 p-3 bg-green-900/30 border border-green-700/50 rounded-lg flex items-center justify-between">
              <span className="text-green-400 text-sm font-medium">
                Vizualizezi terenurile lui: <strong>{assignToName}</strong>
              </span>
              <Link href="/dashboard/terenuri">
                <Button variant="ghost" size="sm" className="text-green-400 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Toate Terenurile
                </Button>
              </Link>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {assignTo ? `Terenurile lui ${assignToName}` : "Terenurile Mele"}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {assignTo
                  ? "Gestionează terenurile persoanei asigurate"
                  : "Gestionează și monitorizează terenurile tale agricole"}
              </p>
            </div>
            <Button
              onClick={() => setShowAddPanel(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adaugă Teren
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
            </div>
          ) : properties.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-slate-800/50 rounded-xl border border-slate-700">
              <MapPin className="h-16 w-16 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                {assignTo
                  ? "Această persoană nu are terenuri încă"
                  : "Nu ai niciun teren înregistrat"}
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                {assignTo
                  ? "Adaugă un teren pentru această persoană asigurată"
                  : "Adaugă primul tău teren pentru a începe monitorizarea"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <TerenCard
                  key={property.id}
                  property={property}
                  onRenew={() => handleRenew(property)}
                  onDelete={() => handleDeleteClick(property)}
                  ownerName={
                    !assignTo && property.assigned_user_id
                      ? ownerMap[property.assigned_user_id] || undefined
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      <DeleteConfirmationModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        propertyName={propertyToDelete?.name}
        isDeleting={!!deletingId}
      />
    </div>
  );
}

