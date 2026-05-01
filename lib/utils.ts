import type { Category } from "./db";

export const CATEGORIES = [
  "email",
  "shopping",
  "social",
  "banking",
  "work",
  "gaming",
  "streaming",
  "other",
] as const satisfies readonly Category[];

export const CATEGORY_META: Record<
  Category,
  { label: string; icon: string; color: string; bg: string }
> = {
  email: {
    label: "Email",
    icon: "📧",
    color: "text-blue-400",
    bg: "bg-blue-500/20 border-blue-500/30",
  },
  shopping: {
    label: "Shopping",
    icon: "🛒",
    color: "text-orange-400",
    bg: "bg-orange-500/20 border-orange-500/30",
  },
  social: {
    label: "Social",
    icon: "💬",
    color: "text-pink-400",
    bg: "bg-pink-500/20 border-pink-500/30",
  },
  banking: {
    label: "Banking",
    icon: "🏦",
    color: "text-emerald-400",
    bg: "bg-emerald-500/20 border-emerald-500/30",
  },
  work: {
    label: "Work",
    icon: "💼",
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/30",
  },
  gaming: {
    label: "Gaming",
    icon: "🎮",
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/30",
  },
  streaming: {
    label: "Streaming",
    icon: "📺",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
  other: {
    label: "Other",
    icon: "🔑",
    color: "text-zinc-400",
    bg: "bg-zinc-500/20 border-zinc-500/30",
  },
};

export function getCategoryMeta(category: string) {
  return CATEGORY_META[category as Category] ?? CATEGORY_META.other;
}

export function formatUrl(url: string): string {
  if (!url) return "";
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
}

export function getDomain(url: string): string {
  try {
    return new URL(formatUrl(url)).hostname.replace("www.", "");
  } catch {
    return url;
  }
}
