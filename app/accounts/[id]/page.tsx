import {
  getAccountById,
  getDecryptedAccount,
  getVaultItemsByAccountId,
} from "@/lib/db";
import { getAccountVisual, formatUrl, getDomain } from "@/lib/utils";
import PasswordField from "@/components/PasswordField";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Pencil,
  Calendar,
  Boxes,
  CreditCard,
  FileText,
  HardDrive,
  Contact,
  HeartHandshake,
} from "lucide-react";
import DeleteAccountButton from "./DeleteAccountButton";
import CopyInlineButton from "./CopyInlineButton";
import FavoriteButton from "@/components/FavoriteButton";
import AccountVisualIcon from "@/components/AccountVisualIcon";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getAccountById(id);
  if (!raw) notFound();
  const linkedItems = await getVaultItemsByAccountId(id);
  const account = getDecryptedAccount(raw);
  const visual = getAccountVisual(account);

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 pl-16 md:pl-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <div className="relative overflow-hidden bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6 mb-4">
        {visual.customGradient ? (
          <div
            className="absolute inset-x-0 top-0 h-28 opacity-60 pointer-events-none"
            style={{ background: visual.customGradient }}
          />
        ) : (
          <div
            className={`absolute inset-x-0 top-0 h-28 opacity-60 pointer-events-none bg-linear-to-b ${visual.gradient}`}
          />
        )}

        <div className="relative flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center text-base font-bold border ${visual.bg}`}
              style={visual.customBadgeStyle}
            >
              <AccountVisualIcon
                category={account.category}
                fallback={visual.icon}
                name={account.name}
                url={account.url}
                brandLabel={visual.brandLabel}
                className="h-6 w-6"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-100 tracking-tight">
                {account.name}
              </h1>
              {account.url && (
                <a
                  href={formatUrl(account.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mt-0.5"
                >
                  {getDomain(account.url)}
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full border ${visual.bg} ${visual.color} shrink-0`}
            style={visual.customBadgeStyle}
          >
            {visual.label}
          </span>
        </div>

        <div className="relative flex items-center gap-2 flex-wrap">
          {account.url && (
            <a
              href={formatUrl(account.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-900/30"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Visit Website
            </a>
          )}
          <Link
            href={`/accounts/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-700/60 text-zinc-300 text-sm font-medium transition-colors border border-zinc-700/60"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <FavoriteButton accountId={id} favorite={account.favorite} />
          <DeleteAccountButton accountId={id} accountName={account.name} />
        </div>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl divide-y divide-zinc-800/60">
        {account.username && (
          <DetailRow label="Username">
            <div className="flex items-center gap-2">
              <span className="font-mono text-zinc-200 text-sm">
                {account.username}
              </span>
              <CopyInlineButton value={account.username} label="username" />
            </div>
          </DetailRow>
        )}
        {account.email && (
          <DetailRow label="Email">
            <div className="flex items-center gap-2">
              <span className="text-zinc-200 text-sm">{account.email}</span>
              <CopyInlineButton value={account.email} label="email" />
            </div>
          </DetailRow>
        )}
        <DetailRow label="Password">
          <PasswordField accountId={id} hasPassword={!!raw.password} />
        </DetailRow>
        {account.url && (
          <DetailRow label="Website">
            <div className="flex items-center gap-2 min-w-0">
              <a
                href={formatUrl(account.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 text-sm transition-colors break-all"
              >
                {account.url}
              </a>
              <CopyInlineButton value={account.url} label="URL" />
            </div>
          </DetailRow>
        )}
        {account.notes && (
          <DetailRow label="Notes">
            <p className="text-zinc-300 text-sm whitespace-pre-wrap leading-relaxed">
              {account.notes}
            </p>
          </DetailRow>
        )}
        {(account.recoveryEmail ||
          account.backupCodes ||
          account.twoFactorEnabled) && (
          <DetailRow label="Recovery">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    account.twoFactorEnabled
                      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                      : "border-zinc-800/60 bg-zinc-950/40 text-zinc-500"
                  }`}
                >
                  2FA {account.twoFactorEnabled ? "enabled" : "not enabled"}
                </span>
              </div>
              {account.recoveryEmail && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-300">
                    {account.recoveryEmail}
                  </span>
                  <CopyInlineButton
                    value={account.recoveryEmail}
                    label="recovery email"
                  />
                </div>
              )}
              {account.backupCodes && (
                <pre className="whitespace-pre-wrap rounded-xl border border-zinc-800/60 bg-zinc-950/40 p-3 text-xs text-zinc-400">
                  {account.backupCodes}
                </pre>
              )}
            </div>
          </DetailRow>
        )}
        {account.tags.length > 0 && (
          <DetailRow label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {account.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-zinc-800/60 bg-zinc-950/40 px-2 py-1 text-xs font-medium text-zinc-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          </DetailRow>
        )}
        <DetailRow label="Added">
          <div className="flex items-center gap-1.5 text-sm text-zinc-400">
            <Calendar className="w-3.5 h-3.5 text-zinc-600" />
            {new Date(account.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </DetailRow>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Linked Command Center Items
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Subscriptions, documents, devices, contacts, and emergency notes
              connected to this account.
            </p>
          </div>
          <Link
            href={`/command-center?accountId=${account.id}&title=${encodeURIComponent(account.name)}&url=${encodeURIComponent(account.url)}`}
            className="rounded-lg border border-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            Add link
          </Link>
        </div>
        {linkedItems.length === 0 ? (
          <p className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-4 text-center text-sm text-zinc-600">
            No linked command-center items yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {linkedItems.map((item) => (
              <Link
                key={item.id}
                href={`/command-center?q=${encodeURIComponent(item.title)}`}
                className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3 transition-colors hover:border-zinc-700 hover:bg-zinc-950/50"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
                    <LinkedItemIcon type={item.type} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {item.title}
                    </p>
                    <p className="text-xs capitalize text-zinc-600">
                      {item.type} - {item.status}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function LinkedItemIcon({ type }: { type: string }) {
  const className = "h-3.5 w-3.5";
  if (type === "subscription") return <CreditCard className={className} />;
  if (type === "document") return <FileText className={className} />;
  if (type === "device") return <HardDrive className={className} />;
  if (type === "contact") return <Contact className={className} />;
  if (type === "emergency") return <HeartHandshake className={className} />;
  return <Boxes className={className} />;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 px-6 py-4">
      <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider w-24 shrink-0 mt-0.5">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
