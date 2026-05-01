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
} from "lucide-react";
import { useState } from "react";
import { getCategoryMeta, getDomain, formatUrl } from "@/lib/utils";
import type { AccountPublic } from "@/lib/db";

const CATEGORY_GRADIENTS: Record<string, string> = {
  email: "from-blue-500/20 to-blue-600/5",
  shopping: "from-orange-500/20 to-orange-600/5",
  social: "from-pink-500/20 to-pink-600/5",
  banking: "from-emerald-500/20 to-emerald-600/5",
  work: "from-purple-500/20 to-purple-600/5",
  gaming: "from-red-500/20 to-red-600/5",
  streaming: "from-yellow-500/20 to-yellow-600/5",
  other: "from-zinc-500/20 to-zinc-600/5",
};

const CATEGORY_GLOW: Record<string, string> = {
  email: "hover:shadow-blue-500/10",
  shopping: "hover:shadow-orange-500/10",
  social: "hover:shadow-pink-500/10",
  banking: "hover:shadow-emerald-500/10",
  work: "hover:shadow-purple-500/10",
  gaming: "hover:shadow-red-500/10",
  streaming: "hover:shadow-yellow-500/10",
  other: "hover:shadow-zinc-500/10",
};

const CATEGORY_BORDER: Record<string, string> = {
  email: "hover:border-blue-500/25",
  shopping: "hover:border-orange-500/25",
  social: "hover:border-pink-500/25",
  banking: "hover:border-emerald-500/25",
  work: "hover:border-purple-500/25",
  gaming: "hover:border-red-500/25",
  streaming: "hover:border-yellow-500/25",
  other: "hover:border-zinc-500/25",
};

interface AccountCardProps {
  account: AccountPublic;
}

export default function AccountCard({ account }: AccountCardProps) {
  const [copiedPw, setCopiedPw] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loadingPw, setLoadingPw] = useState(false);

  const meta = getCategoryMeta(account.category);
  const gradient =
    CATEGORY_GRADIENTS[account.category] ?? CATEGORY_GRADIENTS.other;
  const glow = CATEGORY_GLOW[account.category] ?? CATEGORY_GLOW.other;
  const borderHover =
    CATEGORY_BORDER[account.category] ?? CATEGORY_BORDER.other;

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
      className={`group relative flex flex-col rounded-2xl border border-zinc-800/60 bg-[#0f0f12] overflow-hidden transition-all duration-300 hover:shadow-xl ${glow} ${borderHover} hover:-translate-y-0.5`}
    >
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-linear-to-b ${gradient} pointer-events-none`}
      />
      <Link
        href={`/accounts/${account.id}/edit`}
        className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 transition-all backdrop-blur-sm"
        title="Edit"
      >
        <Pencil className="w-3 h-3" />
      </Link>
      <div className="relative p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl border ${meta.bg} shrink-0`}
          >
            {meta.icon}
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
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.color}`}
              >
                {meta.label}
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
