"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-5xl mb-4">⚠</div>
      <p className="text-zinc-300 font-semibold text-lg mb-1">
        Something went wrong
      </p>
      <p className="text-zinc-600 text-sm max-w-sm mb-8 leading-relaxed">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/30"
        >
          <RefreshCw className="w-4 h-4" />
          Try again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 text-sm font-medium rounded-xl transition-colors border border-zinc-700/60"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
