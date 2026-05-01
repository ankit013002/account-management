import Link from "next/link";
import { AlertTriangle, CheckCircle2, KeyRound, RefreshCw } from "lucide-react";
import type { PasswordHealthReport, PasswordHealthItem } from "@/lib/passwordHealth";

interface PasswordHealthPanelProps {
  report: PasswordHealthReport;
}

export default function PasswordHealthPanel({ report }: PasswordHealthPanelProps) {
  const issues = [
    {
      label: "Weak",
      count: report.weak.length,
      items: report.weak,
      tone: "text-red-400",
      icon: AlertTriangle,
    },
    {
      label: "Reused",
      count: report.reused.length,
      items: report.reused,
      tone: "text-amber-400",
      icon: RefreshCw,
    },
    {
      label: "Missing",
      count: report.missing.length,
      items: report.missing,
      tone: "text-zinc-400",
      icon: KeyRound,
    },
  ];

  const topIssues = [...report.weak, ...report.reused, ...report.missing, ...report.stale].slice(0, 4);

  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-200">
            Password Health
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Weak, reused, missing, and stale credentials
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">
            {report.score}
          </span>
          <span className="text-xs text-emerald-400/60">score</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <HealthStat label="Strong" value={report.strong} tone="text-emerald-400" />
        {issues.map(({ label, count, tone, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3"
          >
            <div className={`mb-2 flex items-center gap-1.5 ${tone}`}>
              <Icon className="h-3.5 w-3.5" />
              <span className="text-xs font-medium">{label}</span>
            </div>
            <p className={`text-2xl font-bold tabular-nums ${tone}`}>{count}</p>
          </div>
        ))}
      </div>

      {topIssues.length > 0 ? (
        <div className="mt-5 space-y-2">
          {topIssues.map((item) => (
            <HealthIssue key={`${item.id}-${item.reason}`} item={item} />
          ))}
        </div>
      ) : (
        <p className="mt-5 rounded-xl border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-400/80">
          No password health issues found.
        </p>
      )}
    </section>
  );
}

function HealthStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3">
      <p className="mb-2 text-xs font-medium text-zinc-500">{label}</p>
      <p className={`text-2xl font-bold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

function HealthIssue({ item }: { item: PasswordHealthItem }) {
  return (
    <Link
      href={`/accounts/${item.id}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-2 text-sm transition-colors hover:border-zinc-700 hover:bg-zinc-900"
    >
      <span className="truncate font-medium text-zinc-300">{item.name}</span>
      <span className="shrink-0 text-xs text-zinc-600">{item.reason}</span>
    </Link>
  );
}
