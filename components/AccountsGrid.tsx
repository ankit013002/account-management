"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, PlusCircle } from "lucide-react";
import Link from "next/link";
import AccountCard from "./AccountCard";
import { CATEGORIES, getCategoryMeta } from "@/lib/utils";
import type { AccountPublic } from "@/lib/db";

interface AccountsGridProps {
  accounts: AccountPublic[];
}

type SortKey = "name" | "createdAt" | "category";

export default function AccountsGrid({ accounts }: AccountsGridProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function cycleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const filtered = useMemo(() => {
    let result = accounts;
    if (activeCategory !== "all") {
      result = result.filter((a) => a.category === activeCategory);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.username.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q) ||
          a.notes.toLowerCase().includes(q),
      );
    }
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "category") {
        cmp = a.category.localeCompare(b.category);
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [accounts, query, activeCategory, sortKey, sortDir]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: accounts.length };
    for (const acc of accounts) {
      counts[acc.category] = (counts[acc.category] ?? 0) + 1;
    }
    return counts;
  }, [accounts]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
          <input
            type="text"
            placeholder="Search by name, username, email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-300 text-xs transition-colors"
            >
              X
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(["name", "createdAt", "category"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => cycleSort(key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl border transition-all ${
                sortKey === key
                  ? "bg-zinc-800 border-zinc-700 text-zinc-200"
                  : "bg-transparent border-zinc-800/60 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {key === "createdAt"
                ? "Date"
                : key.charAt(0).toUpperCase() + key.slice(1)}
              {sortKey === key && (
                <ArrowUpDown
                  className={`w-3 h-3 transition-transform ${
                    sortDir === "desc" ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory("all")}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
            activeCategory === "all"
              ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-400"
              : "bg-transparent border-zinc-800/60 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
          }`}
        >
          All · {categoryCounts.all}
        </button>
        {CATEGORIES.map((cat) => {
          const meta = getCategoryMeta(cat);
          const count = categoryCounts[cat] ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === cat
                  ? `${meta.bg} ${meta.color}`
                  : "bg-transparent border-zinc-800/60 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
              }`}
            >
              {meta.icon} {meta.label} · {count}
            </button>
          );
        })}
      </div>

      {(query || activeCategory !== "all") && (
        <p className="text-xs text-zinc-600">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          {query && <> for &ldquo;{query}&rdquo;</>}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          {accounts.length === 0 ? (
            <>
              <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl mb-5">
                🔐
              </div>
              <p className="text-zinc-300 font-semibold text-lg mb-1">
                No accounts yet
              </p>
              <p className="text-zinc-600 text-sm mb-6">
                Add your first account to get started
              </p>
              <Link
                href="/accounts/new"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-900/30"
              >
                <PlusCircle className="w-4 h-4" />
                Add your first account
              </Link>
            </>
          ) : (
            <>
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-zinc-400 font-medium">No results found</p>
              <p className="text-zinc-600 text-sm mt-1">
                Try a different search
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
