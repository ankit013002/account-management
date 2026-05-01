"use client";

import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function LockButton() {
  const router = useRouter();

  async function lockVault() {
    await fetch("/api/lock", { method: "POST" });
    router.push("/unlock");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={lockVault}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-3 py-2 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200"
    >
      <Lock className="h-3 w-3" />
      Lock vault
    </button>
  );
}
