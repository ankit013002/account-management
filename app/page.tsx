import { getAllAccounts } from "@/lib/db";
import AccountsGrid from "@/components/AccountsGrid";
import Link from "next/link";
import { PlusCircle, KeyRound, Layers, MessageSquare } from "lucide-react";
import { getCategoryMeta } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const accounts = await getAllAccounts();

  const stats = {
    total: accounts.length,
    withPassword: accounts.filter((a) => a.hasPassword).length,
    categories: [...new Set(accounts.map((a) => a.category))].length,
  };

  const recentAccounts = [...accounts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 4);

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 md:pl-8 pl-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {stats.total === 0
              ? "No accounts stored yet"
              : `Managing ${stats.total} account${stats.total !== 1 ? "s" : ""} across ${stats.categories} categor${stats.categories !== 1 ? "ies" : "y"}`}
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-900/30 hover:shadow-indigo-900/40 hover:-translate-y-px shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Add Account</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Total Accounts"
          value={stats.total}
          icon={<Layers className="w-4 h-4" />}
          accent="indigo"
        />
        <StatCard
          label="With Password"
          value={stats.withPassword}
          icon={<KeyRound className="w-4 h-4" />}
          accent="emerald"
        />
        <StatCard
          label="Categories"
          value={stats.categories}
          icon={<Layers className="w-4 h-4" />}
          accent="violet"
        />
      </div>

      {/* Quick access — recent accounts */}
      {recentAccounts.length > 0 && (
        <div>
          <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-3">
            Recently Added
          </h2>
          <div className="flex flex-wrap gap-2">
            {recentAccounts.map((a) => {
              const meta = getCategoryMeta(a.category);
              return (
                <Link
                  key={a.id}
                  href={`/accounts/${a.id}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 text-sm transition-all"
                >
                  <span>{meta.icon}</span>
                  <span className="font-medium">{a.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Assistant promo banner (only when accounts exist) */}
      {stats.total > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-linear-to-r from-indigo-500/10 via-violet-500/5 to-transparent p-5">
          <div className="absolute inset-0 dot-grid opacity-30" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-zinc-200 mb-0.5">
                Ask the AI Assistant
              </p>
              <p className="text-xs text-zinc-500">
                &ldquo;What&rsquo;s my Amazon password?&rdquo; · Powered by
                llama3.1 locally
              </p>
            </div>
            <Link
              href="/chat"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/30 hover:text-indigo-300 text-sm font-medium transition-all shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat
            </Link>
          </div>
        </div>
      )}

      {/* Accounts grid */}
      <div>
        <h2 className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-4">
          All Accounts
        </h2>
        <AccountsGrid accounts={accounts} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: "indigo" | "emerald" | "violet";
}) {
  const colors = {
    indigo: {
      text: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
      icon: "text-indigo-400",
    },
    emerald: {
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      icon: "text-emerald-400",
    },
    violet: {
      text: "text-violet-400",
      bg: "bg-violet-500/10",
      border: "border-violet-500/20",
      icon: "text-violet-400",
    },
  };
  const c = colors[accent];

  return (
    <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-4">
      <div
        className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${c.bg} border ${c.border} ${c.icon} mb-3`}
      >
        {icon}
      </div>
      <p className={`text-2xl font-bold ${c.text} tabular-nums`}>{value}</p>
      <p className="text-xs text-zinc-600 mt-0.5 font-medium">{label}</p>
    </div>
  );
}
