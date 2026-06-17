"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarClock,
  Contact,
  CreditCard,
  FileText,
  HardDrive,
  HeartHandshake,
  Link2,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import type { AccountPublic, VaultItem, VaultItemType } from "@/lib/db";
import { formatUrl } from "@/lib/utils";

const TYPES: {
  type: VaultItemType | "all";
  label: string;
  icon: React.ElementType;
}[] = [
  { type: "all", label: "All", icon: Search },
  { type: "subscription", label: "Subscriptions", icon: CreditCard },
  { type: "document", label: "Documents", icon: FileText },
  { type: "device", label: "Devices", icon: HardDrive },
  { type: "contact", label: "Contacts", icon: Contact },
  { type: "emergency", label: "Emergency", icon: HeartHandshake },
];

const EMPTY_FORM = {
  type: "subscription" as VaultItemType,
  title: "",
  provider: "",
  accountId: "",
  url: "",
  status: "active",
  monthlyCost: "",
  dueDate: "",
  renewalDate: "",
  location: "",
  identifier: "",
  notes: "",
  tags: "",
};

const FIELD =
  "w-full rounded-xl border border-zinc-800/60 bg-zinc-900/60 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 outline-none transition-all focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20";

export default function CommandCenter({
  accounts,
  initialItems,
  initialValues,
}: {
  accounts: AccountPublic[];
  initialItems: VaultItem[];
  initialValues?: Partial<typeof EMPTY_FORM> & { q?: string };
}) {
  const { q: initialQuery, ...formInitialValues } = initialValues ?? {};
  const [items, setItems] = useState(initialItems);
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...formInitialValues,
  });
  const [query, setQuery] = useState(initialQuery ?? "");
  const [type, setType] = useState<VaultItemType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "dueSoon" | "active" | "watching" | "paused" | "archived"
  >("all");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return items.filter((item) => {
      const matchesType = type === "all" || item.type === type;
      const importantDate = item.renewalDate || item.dueDate;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "dueSoon" && isDueSoon(importantDate)) ||
        item.status === statusFilter;
      const matchesQuery =
        !q ||
        [
          item.title,
          item.provider,
          item.url,
          item.location,
          item.identifier,
          item.notes,
          item.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [items, query, statusFilter, type]);

  const stats = useMemo(() => {
    const active = items.filter((item) => item.status !== "archived");
    const monthly = active.reduce((sum, item) => sum + item.monthlyCost, 0);
    const today = new Date();
    const upcoming = active.filter((item) => {
      const date = item.renewalDate || item.dueDate;
      if (!date) return false;
      const due = new Date(`${date}T00:00:00`);
      const days = (due.getTime() - today.getTime()) / 86_400_000;
      return days >= 0 && days <= 30;
    }).length;
    return { active: active.length, monthly, upcoming };
  }, [items]);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/vault-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          monthlyCost: Number(form.monthlyCost || 0),
          tags: form.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save item");
        return;
      }
      setItems((current) => [data, ...current]);
      setForm(EMPTY_FORM);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: VaultItem) {
    const res = await fetch(`/api/vault-items/${item.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((current) => current.filter((current) => current.id !== item.id));
    }
  }

  async function updateItemStatus(item: VaultItem, status: VaultItem["status"]) {
    const res = await fetch(`/api/vault-items/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? updated : currentItem,
        ),
      );
    }
  }

  function resetFilters() {
    setQuery("");
    setType("all");
    setStatusFilter("all");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Metric label="Tracked Items" value={items.length.toString()} />
        <Metric
          label="Monthly Subscriptions"
          value={`$${stats.monthly.toFixed(2)}`}
        />
        <Metric label="Due In 30 Days" value={stats.upcoming.toString()} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100">
              Add anything important
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600">
              Track renewals, document locations, devices, contacts, and
              emergency notes.
            </p>
          </div>
          {error && (
            <span className="rounded-lg border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-300">
              {error}
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select
            value={form.type}
            onChange={(e) => setField("type", e.target.value)}
            className={FIELD}
          >
            {TYPES.filter((item) => item.type !== "all").map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
          <input
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="Title"
            className={FIELD}
          />
          <input
            value={form.provider}
            onChange={(e) => setField("provider", e.target.value)}
            placeholder="Provider or person"
            className={FIELD}
          />
          <select
            value={form.accountId}
            onChange={(e) => setField("accountId", e.target.value)}
            className={FIELD}
          >
            <option value="">Linked account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
          <input
            value={form.monthlyCost}
            onChange={(e) => setField("monthlyCost", e.target.value)}
            placeholder="Monthly cost"
            type="number"
            min="0"
            step="0.01"
            className={FIELD}
          />
          <input
            value={form.dueDate}
            onChange={(e) => setField("dueDate", e.target.value)}
            type="date"
            className={FIELD}
          />
          <input
            value={form.renewalDate}
            onChange={(e) => setField("renewalDate", e.target.value)}
            type="date"
            className={FIELD}
          />
          <input
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Location"
            className={FIELD}
          />
          <input
            value={form.url}
            onChange={(e) => setField("url", e.target.value)}
            placeholder="URL"
            className={FIELD}
          />
          <input
            value={form.identifier}
            onChange={(e) => setField("identifier", e.target.value)}
            placeholder="Policy, serial, membership #"
            className={FIELD}
          />
          <input
            value={form.tags}
            onChange={(e) => setField("tags", e.target.value)}
            placeholder="Tags"
            className={FIELD}
          />
          <button
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add item
          </button>
        </div>
        <textarea
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Notes"
          rows={2}
          className={`${FIELD} mt-3 resize-none`}
        />
      </form>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search command center..."
            className="w-full rounded-xl border border-zinc-800/60 bg-zinc-900/60 py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none transition-all placeholder:text-zinc-600 focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TYPES.map(({ type: itemType, label, icon: Icon }) => (
            <button
              key={itemType}
              type="button"
              onClick={() => setType(itemType)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                type === itemType
                  ? "border-indigo-500/40 bg-indigo-600/20 text-indigo-400"
                  : "border-zinc-800/60 text-zinc-600 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {(
          [
            ["all", "Any status"],
            ["dueSoon", "Due soon"],
            ["active", "Active"],
            ["watching", "Watching"],
            ["paused", "Paused"],
            ["archived", "Archived"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              statusFilter === key
                ? "border-indigo-500/40 bg-indigo-600/20 text-indigo-400"
                : "border-zinc-800/60 text-zinc-600 hover:border-zinc-700 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
        {(query || type !== "all" || statusFilter !== "all") && (
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-all hover:border-zinc-700 hover:text-zinc-300"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/40 py-16 text-center">
          <p className="font-medium text-zinc-300">Nothing here yet</p>
          <p className="mt-1 text-sm text-zinc-600">
            Add a subscription, document, device, contact, or emergency note.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((item) => (
            <VaultItemCard
              key={item.id}
              item={item}
              account={accounts.find((account) => account.id === item.accountId)}
              onDelete={() => deleteItem(item)}
              onStatusChange={(status) => updateItemStatus(item, status)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <p className="text-2xl font-bold tabular-nums text-indigo-300">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-zinc-600">{label}</p>
    </div>
  );
}

function VaultItemCard({
  item,
  account,
  onDelete,
  onStatusChange,
}: {
  item: VaultItem;
  account?: AccountPublic;
  onDelete: () => void;
  onStatusChange: (status: VaultItem["status"]) => void;
}) {
  const TypeIcon =
    TYPES.find((type) => type.type === item.type)?.icon ?? FileText;
  const importantDate = item.renewalDate || item.dueDate;
  const dueSoon = isDueSoon(importantDate);

  return (
    <article className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/10 text-indigo-300">
            <TypeIcon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-100">
              {item.title}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-600">
              {[item.provider, item.status].filter(Boolean).join(" - ")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-300"
          title="Delete item"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {item.monthlyCost > 0 && (
          <Badge>${item.monthlyCost.toFixed(2)}/mo</Badge>
        )}
        {importantDate && (
          <Badge tone={dueSoon ? "warning" : "muted"}>
            {dueSoon && <AlertTriangle className="h-3 w-3" />}
            <CalendarClock className="h-3 w-3" />
            {formatDate(importantDate)}
          </Badge>
        )}
        {item.location && <Badge>{item.location}</Badge>}
        {item.identifier && <Badge>{item.identifier}</Badge>}
      </div>

      {item.notes && (
        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-zinc-400">
          {item.notes}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <select
          value={item.status}
          onChange={(e) =>
            onStatusChange(e.target.value as VaultItem["status"])
          }
          className="rounded-lg border border-zinc-800/60 bg-zinc-950/40 px-2 py-1 text-xs font-medium text-zinc-500 outline-none transition-colors hover:border-zinc-700 hover:text-zinc-300"
          title="Update status"
        >
          <option value="active">Active</option>
          <option value="watching">Watching</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>
        {account && (
          <Link
            href={`/accounts/${account.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <Link2 className="h-3 w-3" />
            {account.name}
          </Link>
        )}
        {item.url && (
          <a
            href={formatUrl(item.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            <Link2 className="h-3 w-3" />
            Open
          </a>
        )}
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-lg border border-zinc-800/60 px-2 py-1 text-xs font-medium text-zinc-600"
          >
            {tag}
          </span>
        ))}
      </div>
    </article>
  );
}

function Badge({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "muted" | "warning";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-xs font-medium ${
        tone === "warning"
          ? "border-amber-500/20 bg-amber-500/10 text-amber-300"
          : "border-zinc-800/60 bg-zinc-950/40 text-zinc-500"
      }`}
    >
      {children}
    </span>
  );
}

function isDueSoon(date: string) {
  if (!date) return false;
  const now = new Date();
  const due = new Date(`${date}T00:00:00`);
  const days = (due.getTime() - now.getTime()) / 86_400_000;
  return days >= 0 && days <= 30;
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
