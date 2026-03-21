"use client";

import { Trash2, Loader2, Wheat, Trees, Grape } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Property } from "@/types";

interface PropertyItemProps {
  property: Property;
  isDeleting?: boolean;
  onSelect?: (property: Property) => void;
  onDelete?: (propertyId: string, e: React.MouseEvent) => void;
}

const getCropIcon = (cropType: string) => {
  switch (cropType.toLowerCase()) {
    case "grau":
    case "wheat":
    case "porumb":
    case "corn":
      return <Wheat className="h-4 w-4" />;
    case "vie":
    case "grape":
      return <Grape className="h-4 w-4" />;
    default:
      return <Trees className="h-4 w-4" />;
  }
};

export default function PropertyItem({
  property,
  isDeleting,
  onSelect,
  onDelete,
}: PropertyItemProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 cursor-pointer border-b border-slate-700/50 last:border-0"
      onClick={() => onSelect?.(property)}
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center text-green-500">
          {getCropIcon(property.crop_type)}
        </div>
        <div>
          <p className="text-sm font-medium text-white">{property.name}</p>
          <p className="text-xs text-slate-400">
            {property.area_ha.toFixed(1)} ha • {property.crop_type}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-500/10"
        onClick={(e) => onDelete?.(property.id, e)}
        disabled={isDeleting}
      >
        {isDeleting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}
