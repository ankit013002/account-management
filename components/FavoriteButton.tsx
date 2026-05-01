"use client";

import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { useState } from "react";

interface FavoriteButtonProps {
  accountId: string;
  favorite: boolean;
  compact?: boolean;
}

export default function FavoriteButton({
  accountId,
  favorite,
  compact = false,
}: FavoriteButtonProps) {
  const router = useRouter();
  const [active, setActive] = useState(favorite);
  const [loading, setLoading] = useState(false);

  async function toggleFavorite() {
    setLoading(true);
    const next = !active;
    setActive(next);
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: next }),
      });
      if (!response.ok) setActive(!next);
      router.refresh();
    } catch {
      setActive(!next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={loading}
      className={`flex items-center justify-center rounded-lg transition-all disabled:opacity-50 ${
        compact
          ? "p-1.5"
          : "gap-2 border border-zinc-700/60 bg-zinc-800/60 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700/60"
      } ${active ? "text-amber-300" : "text-zinc-600 hover:text-zinc-300"}`}
      title={active ? "Unpin account" : "Pin account"}
    >
      <Star className={`h-3.5 w-3.5 ${active ? "fill-current" : ""}`} />
      {!compact && (active ? "Pinned" : "Pin")}
    </button>
  );
}
