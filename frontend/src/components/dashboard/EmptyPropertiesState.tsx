"use client";

import { MapPin } from "lucide-react";
import Link from "next/link";

export default function EmptyPropertiesState() {
  return (
    <div className="h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <MapPin className="h-20 w-20 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Nu ai terenuri înregistrate
        </h2>
        <p className="text-slate-400 mb-6">
          Pentru a vedea harta live cu terenurile tale, trebuie mai întâi să
          adaugi cel puțin un teren.
        </p>
        <Link
          href="/dashboard/terenuri"
          className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
        >
          <MapPin className="h-5 w-5" />
          Adaugă Primul Teren
        </Link>
      </div>
    </div>
  );
}
