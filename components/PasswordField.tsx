"use client";

import { useState } from "react";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface PasswordFieldProps {
  accountId: string;
  hasPassword: boolean;
}

export default function PasswordField({ accountId, hasPassword }: PasswordFieldProps) {
  const toast = useToast();
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function fetchPassword() {
    if (password !== null) return password;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accountId}`);
      const data = await res.json();
      setPassword(data.password ?? "");
      return data.password ?? "";
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle() {
    if (!hasPassword) return;
    await fetchPassword();
    setVisible((v) => !v);
  }

  async function handleCopy() {
    if (!hasPassword) return;
    const pw = await fetchPassword();
    await navigator.clipboard.writeText(pw);
    setCopied(true);
    toast("success", "Copied!", "Password copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  if (!hasPassword) {
    return <span className="text-zinc-600 text-sm">No password set</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 font-mono text-sm bg-zinc-800/60 border border-zinc-700/40 rounded-xl px-3 py-2 text-zinc-300 min-w-0 overflow-hidden">
        {loading ? (
          <span className="text-zinc-600 animate-pulse text-xs">Loading…</span>
        ) : visible && password !== null ? (
          <span className="break-all text-sm">{password}</span>
        ) : (
          <span className="tracking-[0.2em] text-zinc-500">••••••••••••</span>
        )}
      </div>
      <button onClick={handleToggle} className="p-2 rounded-xl text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" title={visible ? "Hide" : "Show"}>
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button onClick={handleCopy} className="p-2 rounded-xl text-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" title="Copy">
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}
