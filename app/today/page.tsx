import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import {
  getAllAccounts,
  getAllVaultItems,
  getRecentAuditEvents,
} from "@/lib/db";
import { isAccountNeedsReview } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const [accounts, items, auditEvents] = await Promise.all([
    getAllAccounts(),
    getAllVaultItems(),
    getRecentAuditEvents(6),
  ]);
  const activeItems = items.filter((item) => item.status !== "archived");
  const overdue = activeItems.filter((item) => getDueState(item) === "overdue");
  const dueSoon = activeItems.filter((item) => getDueState(item) === "soon");
  const subscriptions = activeItems.filter(
    (item) => item.type === "subscription",
  );
  const monthlyCost = subscriptions.reduce(
    (total, item) => total + item.monthlyCost,
    0,
  );
  const reviewAccounts = accounts.filter((account) =>
    isAccountNeedsReview(account),
  );

  return (
    <div className="flex flex-col gap-6 p-6 pl-16 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Today
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            A practical daily view of renewals, security work, and recent vault
            activity.
          </p>
        </div>
        <Link
          href="/command-center"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition-colors hover:bg-indigo-500"
        >
          <CalendarClock className="h-4 w-4" />
          Add Item
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Overdue" value={overdue.length} tone="danger" />
        <Metric label="Due Soon" value={dueSoon.length} tone="warning" />
        <Metric label="Review Queue" value={reviewAccounts.length} tone="warning" />
        <Metric
          label="Monthly Spend"
          value={`$${monthlyCost.toFixed(2)}`}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-indigo-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Upcoming And Overdue
            </h2>
          </div>
          {[...overdue, ...dueSoon].length === 0 ? (
            <EmptyState text="No renewals, due dates, or reminders need attention." />
          ) : (
            <div className="space-y-2">
              {[...overdue, ...dueSoon].slice(0, 8).map((item) => (
                <Link
                  key={item.id}
                  href={`/command-center?q=${encodeURIComponent(item.title)}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.title}
                    </p>
                    <p className="text-xs capitalize text-zinc-600">
                      {item.type} - {item.status}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg border px-2 py-1 text-xs font-medium ${
                      getDueState(item) === "overdue"
                        ? "border-red-500/20 bg-red-500/10 text-red-300"
                        : "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    }`}
                  >
                    {formatDate(item.renewalDate || item.dueDate)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <h2 className="text-sm font-semibold text-zinc-100">
              Security Focus
            </h2>
          </div>
          {reviewAccounts.length === 0 ? (
            <EmptyState text="No account review work is currently queued." />
          ) : (
            <div className="space-y-2">
              {reviewAccounts.slice(0, 6).map((account) => (
                <Link
                  key={account.id}
                  href={`/accounts/${account.id}/edit`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950/50"
                >
                  <span className="truncate text-sm font-medium text-zinc-200">
                    {account.name}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-300">
                    <AlertTriangle className="h-3 w-3" />
                    Fix
                  </span>
                </Link>
              ))}
            </div>
          )}
          {reviewAccounts.length > 0 && (
            <Link
              href="/security"
              className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              <KeyRound className="h-3 w-3" />
              Open full security review
            </Link>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-indigo-300" />
          <h2 className="text-sm font-semibold text-zinc-100">
            Subscription Watch
          </h2>
        </div>
        {subscriptions.length === 0 ? (
          <EmptyState text="No subscriptions are being tracked yet." />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.slice(0, 6).map((item) => (
              <Link
                key={item.id}
                href={`/command-center?q=${encodeURIComponent(item.title)}`}
                className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950/50"
              >
                <p className="truncate text-sm font-medium text-zinc-200">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-zinc-600">
                  ${item.monthlyCost.toFixed(2)}/mo
                  {item.renewalDate
                    ? ` - renews ${formatDate(item.renewalDate)}`
                    : ""}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-100">
          Recent Activity
        </h2>
        {auditEvents.length === 0 ? (
          <EmptyState text="No recent activity yet." />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {auditEvents.map((event) => (
              <Link
                key={event.id}
                href={`/accounts/${event.accountId}`}
                className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950/50"
              >
                <p className="text-sm font-medium text-zinc-200">
                  {event.accountName}
                </p>
                <p className="mt-1 text-xs capitalize text-zinc-600">
                  {event.action} - {formatDateTime(event.createdAt)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "danger" | "warning" | "neutral";
}) {
  const colors = {
    danger: "text-red-300",
    warning: "text-amber-300",
    neutral: "text-indigo-300",
  };
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <p className={`text-2xl font-bold tabular-nums ${colors[tone]}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs font-medium text-zinc-600">{label}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-6 text-center">
      <CheckCircle2 className="mx-auto mb-2 h-5 w-5 text-emerald-300" />
      <p className="text-sm text-zinc-500">{text}</p>
    </div>
  );
}

function getDueState(item: { dueDate: string; renewalDate: string }) {
  const date = item.renewalDate || item.dueDate;
  if (!date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`);
  const days = (due.getTime() - today.getTime()) / 86_400_000;
  if (days < 0) return "overdue";
  if (days <= 30) return "soon";
  return "later";
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
