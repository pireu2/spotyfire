"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PackageType, Property } from "@/types";
import { getProperties, deleteProperty } from "@/lib/api";
import { useUser } from "@stackframe/stack";
import AddTerrainPanel from "@/components/dashboard/AddTerrainPanel";
import TerenCard from "@/components/dashboard/TerenCard";
import PricingModal from "@/components/payment/PricingModal";

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewProperty, setRenewProperty] = useState<Property | null>(null);

  // New state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(
    null,
  );

  const PACKAGE_REPORTS: Record<PackageType, number> = {
    Basic: 5,
    Pro: 15,
    Enterprise: 30,
    "Per Raport": 0,
  };

  const fetchProperties = async () => {
    try {
      setIsLoading(true);
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);
      const data = await getProperties(accessToken || undefined);

      // Get locally stored subscription info (since backend may not persist it)
      const savedSubscriptions = JSON.parse(
        localStorage.getItem("propertySubscriptions") || "{}",
      );

      // Merge API data with localStorage subscription info
      const propertiesWithReports = data.map((p) => {
        const savedSub = savedSubscriptions[p.id];
        const savedPackage = savedSub?.activePackage;
        const activePackage: PackageType = isPackageType(savedPackage)
          ? savedPackage
          : p.activePackage || "Basic";
        const reportsLeft =
          savedSub?.reportsLeft ??
          p.reportsLeft ??
          PACKAGE_REPORTS[activePackage] ??
          5;

        return {
          ...p,
          activePackage,
          reportsLeft,
        };
      });
      setProperties(propertiesWithReports);
    } catch (error) {
      console.error("Failed to fetch properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

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
    setRenewProperty(property);
    setShowRenewModal(true);
  };

  const handleRenewSuccess = (pkg: string, reports: number) => {
    if (!renewProperty) return;

    if (!isPackageType(pkg)) {
      console.error("Invalid package type:", pkg);
      return;
    }

    // Save to localStorage
    const subscriptionData = JSON.parse(
      localStorage.getItem("propertySubscriptions") || "{}",
    );
    subscriptionData[renewProperty.id] = {
      activePackage: pkg,
      reportsLeft: reports,
    };
    localStorage.setItem(
      "propertySubscriptions",
      JSON.stringify(subscriptionData),
    );

    // Update the property with new package and reports
    setProperties((prev) =>
      prev.map((p) =>
        p.id === renewProperty.id
          ? { ...p, activePackage: pkg, reportsLeft: reports }
          : p,
      ),
    );
    setShowRenewModal(false);
    setRenewProperty(null);
  };

  const handleAddSuccess = () => {
    fetchProperties();
    setShowAddPanel(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex">
      {showAddPanel ? (
        <AddTerrainPanel
          onClose={() => setShowAddPanel(false)}
          onSuccess={handleAddSuccess}
          existingProperties={properties}
        />
      ) : (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Terenurile Mele</h1>
              <p className="text-slate-400 text-sm mt-1">
                Gestionează și monitorizează terenurile tale agricole
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
                Nu ai niciun teren înregistrat
              </h3>
              <p className="text-slate-400 text-sm mb-4">
                Adaugă primul tău teren pentru a începe monitorizarea
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
                />
              ))}
            </div>
          )}
        </div>
      )}
      {showRenewModal && renewProperty && (
        <PricingModal
          open={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          areaHa={renewProperty.area_ha}
          userEmail={user?.primaryEmail || ""}
          onPaymentSuccess={handleRenewSuccess}
        />
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
