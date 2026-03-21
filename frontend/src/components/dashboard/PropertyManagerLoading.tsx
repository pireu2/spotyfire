"use client";

import { Loader2 } from "lucide-react";

export default function PropertyManagerLoading() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">Se încarcă...</span>
    </div>
  );
}
