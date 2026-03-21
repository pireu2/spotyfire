"use client";

import { Property } from "@/types";
import PropertyItem from "./PropertyItem";

interface PropertyListProps {
  properties: Property[];
  deletingId?: string | null;
  onPropertySelect?: (property: Property) => void;
  onDelete?: (propertyId: string, e: React.MouseEvent) => void;
}

export default function PropertyList({
  properties,
  deletingId,
  onPropertySelect,
  onDelete,
}: PropertyListProps) {
  if (properties.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-slate-400">Nu ai terenuri înregistrate</p>
      </div>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      {properties.map((property) => (
        <PropertyItem
          key={property.id}
          property={property}
          isDeleting={deletingId === property.id}
          onSelect={onPropertySelect}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
