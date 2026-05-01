"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Download, Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "./ToastProvider";

export default function BackupControls() {
  const router = useRouter();
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<"export" | "import" | null>(null);

  async function exportBackup() {
    setLoading("export");
    try {
      const response = await fetch("/api/backup");
      const backup = await response.blob();
      const url = URL.createObjectURL(backup);
      const link = document.createElement("a");
      link.href = url;
      link.download = `account-management-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast("success", "Backup exported", "Encrypted JSON backup created");
    } catch {
      toast("error", "Export failed", "Could not create backup");
    } finally {
      setLoading(null);
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading("import");
    try {
      const body = await file.text();
      const response = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      toast("success", "Backup imported", `${data.imported} account records restored`);
      router.refresh();
    } catch {
      toast("error", "Import failed", "Backup could not be restored");
    } finally {
      setLoading(null);
      event.target.value = "";
    }
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={exportBackup}
        disabled={loading !== null}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-2 py-2 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
      >
        {loading === "export" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        Export
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading !== null}
        className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-2 py-2 text-[11px] font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
      >
        {loading === "import" ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
        Import
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={importBackup}
        className="hidden"
      />
    </div>
  );
}
