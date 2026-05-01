"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Save,
  Loader2,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { CATEGORIES as CAT_LIST, getCategoryMeta } from "@/lib/utils";
import type { AccountPublic } from "@/lib/db";
import { getPasswordStrength, generatePassword } from "@/lib/password";
import { useToast } from "./ToastProvider";

interface AccountFormProps {
  account?: AccountPublic & { password?: string };
  mode: "create" | "edit";
}

const FIELD =
  "bg-zinc-900/60 border border-zinc-800/60 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all w-full";

const LABEL = "text-xs font-medium text-zinc-500 mb-1.5 block";

const TOGGLE =
  "flex items-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200";

export default function AccountForm({ account, mode }: AccountFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState({
    name: account?.name ?? "",
    username: account?.username ?? "",
    email: account?.email ?? "",
    password: account?.password ?? "",
    url: account?.url ?? "",
    category: account?.category ?? "other",
    notes: account?.notes ?? "",
    tags: account?.tags?.join(", ") ?? "",
  });
  const [showPw, setShowPw] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordOptions, setShowPasswordOptions] = useState(false);
  const [passwordOptions, setPasswordOptions] = useState({
    length: 20,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    avoidAmbiguous: false,
  });

  const strength = getPasswordStrength(form.password);

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setPasswordOption(
    option: keyof typeof passwordOptions,
    value: boolean | number,
  ) {
    setPasswordOptions((current) => {
      const next = { ...current, [option]: value };
      const hasCharset =
        next.uppercase || next.lowercase || next.numbers || next.symbols;
      return hasCharset ? next : current;
    });
  }

  function handleGenerate() {
    const pw = generatePassword(passwordOptions.length, passwordOptions);
    set("password", pw);
    setShowPw(true);
  }

  async function handleCopyPw() {
    if (!form.password) return;
    await navigator.clipboard.writeText(form.password);
    setCopiedPw(true);
    setTimeout(() => setCopiedPw(false), 2000);
    toast("success", "Copied!", "Password copied to clipboard");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Account name is required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const url =
        mode === "edit" ? `/api/accounts/${account!.id}` : "/api/accounts";
      const method = mode === "edit" ? "PUT" : "POST";
      const payload: Record<string, string | string[]> = {
        ...form,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
      };
      if (mode === "edit" && !form.password) delete payload.password;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Something went wrong");
        return;
      }
      const saved = await res.json();
      toast(
        "success",
        mode === "edit" ? "Account updated" : "Account added",
        form.name,
      );
      router.push(`/accounts/${saved.id}`);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">
          <span className="shrink-0">⚠</span>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>
            Account Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Gmail, Amazon, Netflix..."
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>Category</label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className={FIELD}
            style={{ backgroundImage: "none" }}
          >
            {CAT_LIST.map((cat) => {
              const meta = getCategoryMeta(cat);
              return (
                <option key={cat} value={cat}>
                  {meta.icon} {meta.label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL}>Username / Login</label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            placeholder="john_doe"
            autoComplete="off"
            className={FIELD}
          />
        </div>
        <div>
          <label className={LABEL}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="off"
            className={FIELD}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className={LABEL.replace("mb-1.5 block", "")}>
            Password
            {mode === "edit" && (
              <span className="text-zinc-700 ml-1.5">
                (blank = keep current)
              </span>
            )}
          </label>
          <div className="flex items-center gap-1.5">
            {form.password && (
              <button
                type="button"
                onClick={handleCopyPw}
                className="flex items-center gap-1 text-xs text-zinc-600 hover:text-zinc-300 transition-colors"
              >
                {copiedPw ? (
                  <Check className="w-3 h-3 text-emerald-400" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                Copy
              </button>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Wand2 className="w-3 h-3" />
              Generate
            </button>
          </div>
        </div>

        <div className="relative">
          <input
            type={showPw ? "text" : "password"}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            placeholder={
              mode === "edit" ? "••••••••" : "Enter or generate a password"
            }
            autoComplete="new-password"
            className={`${FIELD} pr-20 font-mono`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {form.password && (
              <button
                type="button"
                onClick={handleGenerate}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors"
                title="Regenerate"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="p-1.5 rounded-lg text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              {showPw ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-zinc-800/60 bg-zinc-950/30 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPasswordOptions((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-900/40"
            aria-expanded={showPasswordOptions}
          >
            <div>
              <p className="text-xs font-semibold text-zinc-400">
                Password requirements
              </p>
              <p className="text-[11px] text-zinc-600 mt-0.5">
                Tune this per website before generating.
              </p>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform ${
                showPasswordOptions ? "rotate-180" : ""
              }`}
            />
          </button>
          {showPasswordOptions && (
            <div className="border-t border-zinc-800/60 p-3">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="text-xs font-medium text-zinc-500">
                  Generated length
                </span>
                <input
                  type="number"
                  min={8}
                  max={128}
                  value={passwordOptions.length}
                  onChange={(e) =>
                    setPasswordOption("length", Number(e.target.value))
                  }
                  className="w-20 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500/60"
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <PasswordToggle
                  label="Uppercase"
                  checked={passwordOptions.uppercase}
                  onChange={(checked) =>
                    setPasswordOption("uppercase", checked)
                  }
                />
                <PasswordToggle
                  label="Lowercase"
                  checked={passwordOptions.lowercase}
                  onChange={(checked) =>
                    setPasswordOption("lowercase", checked)
                  }
                />
                <PasswordToggle
                  label="Requires number"
                  checked={passwordOptions.numbers}
                  onChange={(checked) => setPasswordOption("numbers", checked)}
                />
                <PasswordToggle
                  label="Requires symbol"
                  checked={passwordOptions.symbols}
                  onChange={(checked) => setPasswordOption("symbols", checked)}
                />
                <PasswordToggle
                  label="Avoid 0/O/1/l"
                  checked={passwordOptions.avoidAmbiguous}
                  onChange={(checked) =>
                    setPasswordOption("avoidAmbiguous", checked)
                  }
                />
              </div>
            </div>
          )}
        </div>

        {form.password && (
          <div className="mt-2 space-y-1">
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full strength-bar ${strength.color}`}
                style={{ width: strength.width }}
              />
            </div>
            <p
              className={`text-[11px] font-medium ${strength.color.replace(
                "bg-",
                "text-",
              )}`}
            >
              {strength.label}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className={LABEL}>Website URL</label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://gmail.com"
          className={FIELD}
        />
      </div>

      <div>
        <label className={LABEL}>Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Recovery email, 2FA backup codes, security questions..."
          rows={3}
          className={`${FIELD} resize-none`}
        />
      </div>

      <div>
        <label className={LABEL}>Tags</label>
        <input
          type="text"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
          placeholder="personal, client, critical"
          className={FIELD}
        />
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-500 bg-zinc-900/60 border border-zinc-800/60 hover:bg-zinc-800/60 hover:text-zinc-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors shadow-lg shadow-indigo-900/20"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {mode === "edit" ? "Save Changes" : "Add Account"}
        </button>
      </div>
    </form>
  );
}

function PasswordToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={TOGGLE}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-indigo-500"
      />
      {label}
    </label>
  );
}
