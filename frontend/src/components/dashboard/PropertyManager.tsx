"use client";

import { useState, useEffect } from "react";
import { MapPin, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Property } from "@/types";
import { PropertyService } from "@/services/propertyService";
import { useUser } from "@stackframe/stack";
import Link from "next/link";
import PropertyList from "./PropertyList";
import PropertyManagerLoading from "./PropertyManagerLoading";

interface PropertyManagerProps {
  onPropertySelect?: (property: Property) => void;
}

export default function PropertyManager({
  onPropertySelect,
}: PropertyManagerProps) {
  const user = useUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchProperties = async () => {
      try {
        setIsLoading(true);
        const accessToken = await user
          ?.getAuthJson()
          .then((auth) => auth?.accessToken);
        const data = await PropertyService.getAll(accessToken || undefined);
        setProperties(data);
      } catch (error) {
        console.error("Failed to fetch properties:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperties();
  }, [user]);

  const handleDelete = async (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Ești sigur că vrei să ștergi acest teren?")) return;

    try {
      setDeletingId(propertyId);
      const accessToken = await user
        ?.getAuthJson()
        .then((auth) => auth?.accessToken);
      await PropertyService.delete(propertyId, accessToken || undefined);
      setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (error) {
      console.error("Failed to delete property:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const hasProperties = properties.length > 0;

  if (isLoading) {
    return <PropertyManagerLoading />;
  }

  return (
    <div className="relative">
      {hasProperties ? (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition-colors w-full">
            <MapPin className="h-5 w-5" />
            <span className="flex-1 text-left">Terenurile Mele</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-full top-0 ml-2 w-72 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="p-2 border-b border-slate-700">
                <Link href="/dashboard/terenuri">
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adaugă Teren Nou
                  </Button>
                </Link>
              </div>

              <PropertyList
                properties={properties}
                deletingId={deletingId}
                onPropertySelect={onPropertySelect}
                onDelete={handleDelete}
              />

              <div className="p-2 bg-slate-700/50 border-t border-slate-700">
                <p className="text-xs text-slate-400 text-center">
                  {properties.length} teren
                  {properties.length !== 1 ? "uri" : ""} înregistrate
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Link
          href="/dashboard/terenuri"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-green-500 hover:bg-green-600/20 transition-colors w-full"
        >
          <Plus className="h-5 w-5" />
          <span>Adaugă Teren</span>
        </Link>
      )}
    </div>
  );
}
