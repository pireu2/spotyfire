"use client";

import { useState, memo } from "react";
import { Layers, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MapLayersProps {
  activeLayer: string;
  onLayerChange: (layer: string) => void;
}

const layers = [
  { id: "standard", name: "Standard", icon: Layers },
  { id: "satellite", name: "Satelit", icon: Layers },
  { id: "terrain", name: "Relief", icon: Layers },
];

function MapLayers({ activeLayer, onLayerChange }: MapLayersProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-1000">
      <Button
        variant="outline"
        size="icon"
        className="bg-white/90 backdrop-blur border-slate-200 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Layers className="h-4 w-4 text-slate-700" />
      </Button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-white/95 backdrop-blur rounded-lg shadow-xl border border-slate-200 p-3 min-w-[180px]">
          <h4 className="text-sm font-semibold text-slate-700 mb-2">
            Tip Hartă
          </h4>
          <div className="space-y-1">
            {layers.map((layer) => (
              <button
                key={layer.id}
                onClick={() => {
                  onLayerChange(layer.id);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm transition-colors ${activeLayer === layer.id
                    ? "bg-green-100 text-green-700 font-medium"
                    : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {activeLayer === layer.id ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <div className="w-4 h-4" /> // Spacer
                )}
                {layer.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(MapLayers);
