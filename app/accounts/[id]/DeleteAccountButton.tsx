"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface Props {
  accountId: string;
  accountName: string;
}

export default function DeleteAccountButton({ accountId, accountName }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete "${accountName}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await fetch(`/api/accounts/${accountId}`, { method: "DELETE" });
      toast("success", "Account deleted", accountName);
      router.push("/");
      router.refresh();
    } catch {
      toast("error", "Delete failed", "Please try again");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/15 text-red-400 hover:text-red-300 text-sm font-medium transition-colors disabled:opacity-60 border border-red-500/20 ml-auto"
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Trash2 className="w-3.5 h-3.5" />
      )}
      Delete
    </button>
  );
}
