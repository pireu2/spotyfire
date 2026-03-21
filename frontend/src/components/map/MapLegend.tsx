"use client";

interface MapLegendItem {
  color: string;
  label: string;
}

interface MapLegendProps {
  items?: MapLegendItem[];
}

const DEFAULT_ITEMS: MapLegendItem[] = [
  { color: "bg-green-500", label: "Sănătos" },
  { color: "bg-orange-500", label: "Incendiu" },
  { color: "bg-blue-500", label: "Inundație" },
];

export default function MapLegend({ items = DEFAULT_ITEMS }: MapLegendProps) {
  return (
    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur px-4 py-2 rounded-lg flex items-center gap-4">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${item.color}`} />
          <span className="text-xs text-slate-300">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
