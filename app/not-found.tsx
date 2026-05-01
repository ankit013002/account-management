import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="text-6xl font-black text-zinc-800 tabular-nums mb-4">
        404
      </div>
      <p className="text-zinc-300 font-semibold text-lg mb-1">Page not found</p>
      <p className="text-zinc-600 text-sm max-w-xs mb-8">
        That page doesn&apos;t exist or has been removed.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-900/30"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
}
