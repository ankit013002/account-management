"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition-colors hover:bg-indigo-500 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Print
    </button>
  );
}
