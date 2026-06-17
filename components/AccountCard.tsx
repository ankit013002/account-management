"use client";

import Link from "next/link";
import {
  ExternalLink,
  Copy,
  Check,
  Eye,
  EyeOff,
  Pencil,
  User,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import {
  getAccountQualityHints,
  getAccountVisual,
  getDomain,
  formatUrl,
} from "@/lib/utils";
import type { AccountPublic } from "@/lib/db";
import AccountVisualIcon from "./AccountVisualIcon";
import FavoriteButton from "./FavoriteButton";

interface AccountCardProps {
  account: AccountPublic;
}

export default function AccountCard({ account }: AccountCardProps) {
  const [copiedPw, setCopiedPw] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loadingPw, setLoadingPw] = useState(false);

  const visual = getAccountVisual(account);
  const qualityHints = getAccountQualityHints(account).slice(0, 2);

  async function fetchPassword(): Promise<string> {
    if (password !== null) return password;
    setLoadingPw(true);
    try {
      const res = await fetch(`/api/accounts/${account.id}`);
      const data = await res.json();
      const pw = data.password ?? "";
      setPassword(pw);
      return pw;
    } finally {
      setLoadingPw(false);
    }
  }

  async function handleCopyPassword() {
    const pw = await fetchPassword();
    await navigator.clipboard.writeText(pw);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
  }

  async function handleTogglePassword() {
    await fetchPassword();
    setShowPw((v) => !v);
  }

  async function handleCopyUsername() {
    await navigator.clipboard.writeText(account.username);
    setCopiedUser(true);
    setTimeout(() => setCopiedUser(false), 2000);
  }

  return (
    <div
      className={`group relative flex flex-col rounded-2xl border border-zinc-800/60 bg-[#0f0f12] overflow-hidden transition-all duration-300 hover:shadow-xl ${visual.glow} ${visual.border} hover:-translate-y-0.5`}
    >
      {visual.customGradient ? (
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none"
          style={{ background: visual.customGradient }}
        />
      ) : (
        <div
          className={`absolute inset-x-0 top-0 h-24 bg-linear-to-b ${visual.gradient} pointer-events-none`}
        />
      )}
      <Link
        href={`/accounts/${account.id}/edit`}
        className="absolute top-3 right-10 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all backdrop-blur-sm"
        title="Edit"
      >
        <Pencil className="w-3 h-3" />
      </Link>
      <div className="absolute right-3 top-3 z-10 rounded-lg bg-zinc-800/80 backdrop-blur-sm">
        <FavoriteButton
          accountId={account.id}
          favorite={account.favorite}
          compact
        />
      </div>
      <div className="relative p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${visual.bg} shrink-0`}
            style={visual.customBadgeStyle}
          >
            <AccountVisualIcon
              category={account.category}
              fallback={visual.icon}
              name={account.name}
              url={account.url}
              brandLabel={visual.brandLabel}
              className="h-4 w-4"
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-zinc-100 text-sm leading-tight truncate">
              {account.name}
            </h3>
            {account.url ? (
              <span className="text-[11px] text-zinc-500 truncate block">
                {getDomain(account.url)}
              </span>
            ) : (
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${visual.bg} ${visual.color}`}
                style={visual.customBadgeStyle}
              >
                {visual.label}
              </span>
            )}
          </div>
        </div>
        {account.username && (
          <div className="flex items-center gap-1.5 group/user">
            <User className="w-3 h-3 text-zinc-600 shrink-0" />
            <span className="text-xs text-zinc-400 truncate flex-1 font-mono">
              {account.username}
            </span>
            <button
              onClick={handleCopyUsername}
              className="opacity-0 group-hover/user:opacity-100 p-1 rounded text-zinc-600 hover:text-zinc-300 transition-all"
              title="Copy username"
            >
              {copiedUser ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        {account.hasPassword && (
          <div className="flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-2.5 py-1.5">
            <div className="flex-1 font-mono text-[11px] text-zinc-500 overflow-hidden">
              {loadingPw ? (
                <span className="skeleton inline-block w-16 h-2.5 rounded" />
              ) : showPw && password !== null ? (
                <span className="break-all text-zinc-300">{password}</span>
              ) : (
                <span className="tracking-[0.2em] text-zinc-600">
                  ••••••••••
                </span>
              )}
            </div>
            <button
              onClick={handleTogglePassword}
              className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
              title={showPw ? "Hide" : "Show"}
            >
              {showPw ? (
                <EyeOff className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
            </button>
            <button
              onClick={handleCopyPassword}
              className="p-1 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
              title="Copy password"
            >
              {copiedPw ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
        )}
        {account.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {account.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md border border-zinc-800/60 bg-zinc-900/60 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {account.twoFactorEnabled && (
          <span className="w-fit rounded-md border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
            2FA
          </span>
        )}
        {qualityHints.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {qualityHints.map((hint) => (
              <span
                key={hint.key}
                className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${
                  hint.tone === "warning"
                    ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
                    : "border-zinc-800/60 bg-zinc-950/40 text-zinc-500"
                }`}
              >
                {hint.tone === "warning" && (
                  <AlertTriangle className="h-2.5 w-2.5" />
                )}
                {hint.label}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1.5 pt-1 mt-auto">
          <Link
            href={`/accounts/${account.id}`}
            className="flex-1 text-center text-[11px] font-medium text-zinc-500 hover:text-zinc-200 py-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors"
          >
            View details
          </Link>
          {account.url && (
            <a
              href={formatUrl(account.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 py-1.5 px-2.5 rounded-lg hover:bg-indigo-500/10 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
