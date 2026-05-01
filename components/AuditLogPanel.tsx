import Link from "next/link";
import { Clock3 } from "lucide-react";
import type { AuditEvent } from "@/lib/db";

interface AuditLogPanelProps {
  events: AuditEvent[];
}

export default function AuditLogPanel({ events }: AuditLogPanelProps) {
  if (events.length === 0) return null;

  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-zinc-500" />
        <h2 className="text-sm font-semibold text-zinc-200">Recent Activity</h2>
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/accounts/${event.accountId}`}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-2 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
          >
            <span className="min-w-0 truncate text-zinc-300">
              <span className="capitalize text-zinc-500">{event.action}</span>{" "}
              {event.accountName}
            </span>
            <span className="shrink-0 text-xs text-zinc-600">
              {new Date(event.createdAt).toLocaleDateString()}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
