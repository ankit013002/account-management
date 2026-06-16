"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  CloudDownload,
  DatabaseBackup,
  Loader2,
  RefreshCw,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import { useToast } from "./ToastProvider";

interface CollectionSummary {
  count: number;
  latestTimestamp: string;
}

interface SnapshotStatus {
  atlas: {
    database: string;
    collections: Record<string, CollectionSummary>;
    error?: string;
  } | null;
  local: {
    database: string;
    collections: Record<string, CollectionSummary>;
    error?: string;
  } | null;
  latestSnapshot: {
    fileName: string;
    exportedAt: string;
    sourceDatabase: string;
    collections: Record<string, CollectionSummary>;
  } | null;
  snapshotMatchesAtlas: boolean;
  localMatchesSnapshot: boolean;
}

type LoadingAction = "status" | "create" | "restore" | null;

function formatDate(value?: string) {
  if (!value) return "Never";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function totalAccounts(status: SnapshotStatus | null, source: "atlas" | "local") {
  return status?.[source]?.collections.accounts?.count ?? 0;
}

export default function SnapshotControls() {
  const toast = useToast();
  const [status, setStatus] = useState<SnapshotStatus | null>(null);
  const [loading, setLoading] = useState<LoadingAction>(null);

  const health = useMemo(() => {
    if (!status) return { label: "Not checked", tone: "text-zinc-500" };
    if (status.atlas?.error || status.local?.error) {
      return { label: "Needs attention", tone: "text-amber-400" };
    }
    if (status.snapshotMatchesAtlas && status.localMatchesSnapshot) {
      return { label: "Local current", tone: "text-emerald-400" };
    }
    if (status.snapshotMatchesAtlas) {
      return { label: "Snapshot ready", tone: "text-indigo-400" };
    }
    return { label: "Snapshot stale", tone: "text-amber-400" };
  }, [status]);

  async function refreshStatus(showToast = false) {
    setLoading("status");
    try {
      const response = await fetch("/api/snapshots");
      const data = (await response.json()) as SnapshotStatus | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "Could not check snapshots");
      }
      setStatus(data);
      if (showToast) {
        toast("success", "Snapshot status checked", "Atlas and local state compared");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Status check failed";
      toast("error", "Status check failed", message);
    } finally {
      setLoading(null);
    }
  }

  async function createSnapshot() {
    setLoading("create");
    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data.status);
      toast("success", "Snapshot created", data.snapshot.fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Snapshot failed";
      toast("error", "Snapshot failed", message);
    } finally {
      setLoading(null);
    }
  }

  async function restoreLocal() {
    if (
      !window.confirm(
        "Restore the latest encrypted snapshot into local MongoDB? Existing matching local records will be updated.",
      )
    ) {
      return;
    }

    setLoading("restore");
    try {
      const response = await fetch("/api/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "restore-local" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStatus(data.status);
      toast("success", "Local snapshot restored", data.restore.fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Restore failed";
      toast("error", "Restore failed", message);
    } finally {
      setLoading(null);
    }
  }

  const busy = loading !== null;

  return (
    <div className="mt-3 rounded-xl border border-zinc-800/60 bg-zinc-950/35 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <DatabaseBackup className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          <span className="truncate text-[11px] font-semibold text-zinc-300">
            Snapshots
          </span>
        </div>
        <span className={`shrink-0 text-[10px] font-medium ${health.tone}`}>
          {health.label}
        </span>
      </div>

      <div className="space-y-1.5 text-[10px] text-zinc-500">
        <div className="flex items-center justify-between gap-2">
          <span>Atlas</span>
          <span className="truncate text-zinc-400">
            {status?.atlas?.error
              ? "Error"
              : `${totalAccounts(status, "atlas")} accounts`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Local</span>
          <span className="truncate text-zinc-400">
            {status?.local?.error
              ? "Error"
              : `${totalAccounts(status, "local")} accounts`}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span>Latest</span>
          <span className="truncate text-zinc-400">
            {formatDate(status?.latestSnapshot?.exportedAt)}
          </span>
        </div>
      </div>

      {(status?.atlas?.error || status?.local?.error) && (
        <div className="mt-2 flex gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-[10px] leading-snug text-amber-300/80">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="min-w-0 truncate">
            {status.atlas?.error || status.local?.error}
          </span>
        </div>
      )}

      {status?.snapshotMatchesAtlas && status.localMatchesSnapshot && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-emerald-400/80">
          <CheckCircle2 className="h-3 w-3" />
          Atlas, snapshot, and local match
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => refreshStatus(true)}
          disabled={busy}
          className="flex h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          title="Check snapshot status"
        >
          {loading === "status" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={createSnapshot}
          disabled={busy}
          className="flex h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          title="Create Atlas snapshot"
        >
          {loading === "create" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CloudDownload className="h-3.5 w-3.5" />
          )}
        </button>
        <button
          type="button"
          onClick={restoreLocal}
          disabled={busy || !status?.latestSnapshot}
          className="flex h-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/70 text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-50"
          title="Restore latest snapshot to local MongoDB"
        >
          {loading === "restore" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
