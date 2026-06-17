import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { getAllAccounts } from "@/lib/db";
import { getAccountQualityHints, isAccountNeedsReview } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SecurityPage() {
  const accounts = await getAllAccounts();
  const reviewAccounts = accounts.filter((account) =>
    isAccountNeedsReview(account),
  );
  const missingPassword = accounts.filter((account) => !account.hasPassword);
  const missingLogin = accounts.filter(
    (account) => !account.username && !account.email,
  );
  const missing2fa = accounts.filter((account) => !account.twoFactorEnabled);
  const missingRecovery = accounts.filter((account) => !account.recoveryEmail);

  return (
    <div className="flex flex-col gap-6 p-6 pl-16 md:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
            Security Review
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Tighten weak spots across passwords, login details, 2FA, and
            recovery coverage.
          </p>
        </div>
        <Link
          href="/accounts/new"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 transition-colors hover:bg-indigo-500"
        >
          <KeyRound className="h-4 w-4" />
          Add Account
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <ReviewMetric
          label="Needs Review"
          value={reviewAccounts.length}
          icon={AlertTriangle}
          tone={reviewAccounts.length ? "warning" : "good"}
        />
        <ReviewMetric
          label="No Password"
          value={missingPassword.length}
          icon={KeyRound}
          tone={missingPassword.length ? "warning" : "good"}
        />
        <ReviewMetric
          label="No Login"
          value={missingLogin.length}
          icon={UserRound}
          tone={missingLogin.length ? "warning" : "good"}
        />
        <ReviewMetric
          label="No 2FA"
          value={missing2fa.length}
          icon={ShieldCheck}
          tone={missing2fa.length ? "warning" : "good"}
        />
        <ReviewMetric
          label="No Recovery"
          value={missingRecovery.length}
          icon={ExternalLink}
          tone={missingRecovery.length ? "warning" : "good"}
        />
      </div>

      {reviewAccounts.length === 0 ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-300" />
          <p className="mt-3 text-lg font-semibold text-zinc-100">
            Everything important is covered
          </p>
          <p className="mt-1 text-sm text-emerald-300/70">
            Passwords, login details, 2FA, and recovery emails are filled in.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {reviewAccounts.map((account) => {
            const hints = getAccountQualityHints(account);
            return (
              <article
                key={account.id}
                className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                      {account.name}
                    </h2>
                    <p className="mt-0.5 text-xs text-zinc-600">
                      {account.url || account.email || account.username || "No login details"}
                    </p>
                  </div>
                  <Link
                    href={`/accounts/${account.id}/edit`}
                    className="rounded-lg border border-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
                  >
                    Fix
                  </Link>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {hints.map((hint) => (
                    <span
                      key={hint.key}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
                        hint.tone === "warning"
                          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                          : "border-zinc-800/60 bg-zinc-950/40 text-zinc-500"
                      }`}
                    >
                      {hint.tone === "warning" && (
                        <AlertTriangle className="h-3 w-3" />
                      )}
                      {hint.label}
                    </span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewMetric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  tone: "warning" | "good";
}) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <span
        className={`mb-3 inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
          tone === "warning"
            ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
            : "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-2xl font-bold tabular-nums text-zinc-100">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-zinc-600">{label}</p>
    </div>
  );
}
