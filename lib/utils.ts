import type { Category } from "./db";

export const CATEGORIES = [
  "email",
  "shopping",
  "social",
  "banking",
  "work",
  "gaming",
  "streaming",
  "productivity",
  "cloud",
  "developer",
  "ai",
  "education",
  "travel",
  "food",
  "health",
  "government",
  "utilities",
  "crypto",
  "insurance",
  "telecom",
  "home",
  "news",
  "music",
  "creator",
  "security",
  "brand",
  "custom",
  "other",
] as const satisfies readonly Category[];

export const ACCENT_PRESETS = [
  { name: "Sky", color: "#38bdf8" },
  { name: "Mint", color: "#34d399" },
  { name: "Lime", color: "#a3e635" },
  { name: "Gold", color: "#fbbf24" },
  { name: "Coral", color: "#fb7185" },
  { name: "Violet", color: "#a78bfa" },
  { name: "Fuchsia", color: "#e879f9" },
  { name: "Slate", color: "#cbd5e1" },
] as const;

type CategoryMeta = {
  label: string;
  icon: string;
  color: string;
  bg: string;
  gradient: string;
  glow: string;
  border: string;
  accent: string;
};

function meta(
  label: string,
  icon: string,
  color: string,
  bg: string,
  gradient: string,
  glow: string,
  border: string,
  accent: string,
): CategoryMeta {
  return { label, icon, color, bg, gradient, glow, border, accent };
}

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  email: meta("Email", "@", "text-blue-400", "bg-blue-500/20 border-blue-500/30", "from-blue-500/20 to-blue-600/5", "hover:shadow-blue-500/10", "hover:border-blue-500/25", "#60a5fa"),
  shopping: meta("Shopping", "$", "text-orange-400", "bg-orange-500/20 border-orange-500/30", "from-orange-500/20 to-orange-600/5", "hover:shadow-orange-500/10", "hover:border-orange-500/25", "#fb923c"),
  social: meta("Social", "#", "text-pink-400", "bg-pink-500/20 border-pink-500/30", "from-pink-500/20 to-pink-600/5", "hover:shadow-pink-500/10", "hover:border-pink-500/25", "#f472b6"),
  banking: meta("Banking", "B", "text-emerald-400", "bg-emerald-500/20 border-emerald-500/30", "from-emerald-500/20 to-emerald-600/5", "hover:shadow-emerald-500/10", "hover:border-emerald-500/25", "#34d399"),
  work: meta("Work", "W", "text-purple-400", "bg-purple-500/20 border-purple-500/30", "from-purple-500/20 to-purple-600/5", "hover:shadow-purple-500/10", "hover:border-purple-500/25", "#c084fc"),
  gaming: meta("Gaming", "G", "text-red-400", "bg-red-500/20 border-red-500/30", "from-red-500/20 to-red-600/5", "hover:shadow-red-500/10", "hover:border-red-500/25", "#f87171"),
  streaming: meta("Streaming", "TV", "text-yellow-400", "bg-yellow-500/20 border-yellow-500/30", "from-yellow-500/20 to-yellow-600/5", "hover:shadow-yellow-500/10", "hover:border-yellow-500/25", "#facc15"),
  productivity: meta("Productivity", "DO", "text-cyan-400", "bg-cyan-500/20 border-cyan-500/30", "from-cyan-500/20 to-cyan-600/5", "hover:shadow-cyan-500/10", "hover:border-cyan-500/25", "#22d3ee"),
  cloud: meta("Cloud", "CL", "text-sky-400", "bg-sky-500/20 border-sky-500/30", "from-sky-500/20 to-sky-600/5", "hover:shadow-sky-500/10", "hover:border-sky-500/25", "#38bdf8"),
  developer: meta("Developer", "</>", "text-lime-400", "bg-lime-500/20 border-lime-500/30", "from-lime-500/20 to-lime-600/5", "hover:shadow-lime-500/10", "hover:border-lime-500/25", "#a3e635"),
  ai: meta("AI", "AI", "text-violet-400", "bg-violet-500/20 border-violet-500/30", "from-violet-500/20 to-violet-600/5", "hover:shadow-violet-500/10", "hover:border-violet-500/25", "#a78bfa"),
  education: meta("Education", "ED", "text-amber-400", "bg-amber-500/20 border-amber-500/30", "from-amber-500/20 to-amber-600/5", "hover:shadow-amber-500/10", "hover:border-amber-500/25", "#fbbf24"),
  travel: meta("Travel", "TR", "text-teal-400", "bg-teal-500/20 border-teal-500/30", "from-teal-500/20 to-teal-600/5", "hover:shadow-teal-500/10", "hover:border-teal-500/25", "#2dd4bf"),
  food: meta("Food", "FD", "text-rose-400", "bg-rose-500/20 border-rose-500/30", "from-rose-500/20 to-rose-600/5", "hover:shadow-rose-500/10", "hover:border-rose-500/25", "#fb7185"),
  health: meta("Health", "+", "text-green-400", "bg-green-500/20 border-green-500/30", "from-green-500/20 to-green-600/5", "hover:shadow-green-500/10", "hover:border-green-500/25", "#4ade80"),
  government: meta("Government", "GV", "text-slate-300", "bg-slate-500/20 border-slate-500/30", "from-slate-500/20 to-slate-600/5", "hover:shadow-slate-500/10", "hover:border-slate-500/25", "#cbd5e1"),
  utilities: meta("Utilities", "UT", "text-yellow-300", "bg-yellow-400/20 border-yellow-400/30", "from-yellow-400/20 to-yellow-500/5", "hover:shadow-yellow-400/10", "hover:border-yellow-400/25", "#fde047"),
  crypto: meta("Crypto", "CR", "text-orange-300", "bg-orange-400/20 border-orange-400/30", "from-orange-400/20 to-orange-500/5", "hover:shadow-orange-400/10", "hover:border-orange-400/25", "#fdba74"),
  insurance: meta("Insurance", "IN", "text-blue-300", "bg-blue-400/20 border-blue-400/30", "from-blue-400/20 to-blue-500/5", "hover:shadow-blue-400/10", "hover:border-blue-400/25", "#93c5fd"),
  telecom: meta("Telecom", "PH", "text-fuchsia-400", "bg-fuchsia-500/20 border-fuchsia-500/30", "from-fuchsia-500/20 to-fuchsia-600/5", "hover:shadow-fuchsia-500/10", "hover:border-fuchsia-500/25", "#e879f9"),
  home: meta("Home", "HM", "text-stone-300", "bg-stone-500/20 border-stone-500/30", "from-stone-500/20 to-stone-600/5", "hover:shadow-stone-500/10", "hover:border-stone-500/25", "#d6d3d1"),
  news: meta("News", "NW", "text-red-300", "bg-red-400/20 border-red-400/30", "from-red-400/20 to-red-500/5", "hover:shadow-red-400/10", "hover:border-red-400/25", "#fca5a5"),
  music: meta("Music", "MU", "text-green-300", "bg-green-400/20 border-green-400/30", "from-green-400/20 to-green-500/5", "hover:shadow-green-400/10", "hover:border-green-400/25", "#86efac"),
  creator: meta("Creator", "CR", "text-pink-300", "bg-pink-400/20 border-pink-400/30", "from-pink-400/20 to-pink-500/5", "hover:shadow-pink-400/10", "hover:border-pink-400/25", "#f9a8d4"),
  security: meta("Security", "SE", "text-emerald-300", "bg-emerald-400/20 border-emerald-400/30", "from-emerald-400/20 to-emerald-500/5", "hover:shadow-emerald-400/10", "hover:border-emerald-400/25", "#6ee7b7"),
  brand: meta("Brand / Company", "CO", "text-indigo-300", "bg-indigo-400/20 border-indigo-400/30", "from-indigo-400/20 to-indigo-500/5", "hover:shadow-indigo-400/10", "hover:border-indigo-400/25", "#a5b4fc"),
  custom: meta("Custom", "*", "text-white", "bg-white/10 border-white/20", "from-white/15 to-white/5", "hover:shadow-white/10", "hover:border-white/25", "#f4f4f5"),
  other: meta("Other", "?", "text-zinc-400", "bg-zinc-500/20 border-zinc-500/30", "from-zinc-500/20 to-zinc-600/5", "hover:shadow-zinc-500/10", "hover:border-zinc-500/25", "#a1a1aa"),
};

const BRAND_THEMES = [
  { keys: ["google", "gmail", "youtube"], label: "Google", icon: "G", accent: "#4285f4", gradient: "linear-gradient(135deg, rgba(66, 133, 244, 0.26), rgba(251, 188, 5, 0.14), rgba(52, 168, 83, 0.08))" },
  { keys: ["steam"], label: "Steam", icon: "S", accent: "#66c0f4", gradient: "linear-gradient(135deg, rgba(102, 192, 244, 0.24), rgba(27, 40, 56, 0.24))" },
  { keys: ["apple", "icloud"], label: "Apple", icon: "A", accent: "#d4d4d8", gradient: "linear-gradient(135deg, rgba(244, 244, 245, 0.2), rgba(113, 113, 122, 0.1))" },
  { keys: ["microsoft", "outlook", "xbox"], label: "Microsoft", icon: "M", accent: "#00a4ef", gradient: "linear-gradient(135deg, rgba(0, 164, 239, 0.22), rgba(127, 186, 0, 0.1), rgba(255, 185, 0, 0.08))" },
  { keys: ["github"], label: "GitHub", icon: "GH", accent: "#f5f5f5", gradient: "linear-gradient(135deg, rgba(245, 245, 245, 0.16), rgba(82, 82, 91, 0.1))" },
  { keys: ["amazon", "aws"], label: "Amazon", icon: "A", accent: "#ff9900", gradient: "linear-gradient(135deg, rgba(255, 153, 0, 0.24), rgba(20, 110, 180, 0.1))" },
  { keys: ["netflix"], label: "Netflix", icon: "N", accent: "#e50914", gradient: "linear-gradient(135deg, rgba(229, 9, 20, 0.24), rgba(120, 0, 8, 0.1))" },
  { keys: ["spotify"], label: "Spotify", icon: "SP", accent: "#1db954", gradient: "linear-gradient(135deg, rgba(29, 185, 84, 0.24), rgba(25, 20, 20, 0.12))" },
  { keys: ["discord"], label: "Discord", icon: "D", accent: "#5865f2", gradient: "linear-gradient(135deg, rgba(88, 101, 242, 0.24), rgba(64, 78, 237, 0.1))" },
  { keys: ["reddit"], label: "Reddit", icon: "R", accent: "#ff4500", gradient: "linear-gradient(135deg, rgba(255, 69, 0, 0.24), rgba(255, 139, 96, 0.08))" },
  { keys: ["twitch"], label: "Twitch", icon: "T", accent: "#9146ff", gradient: "linear-gradient(135deg, rgba(145, 70, 255, 0.25), rgba(82, 31, 153, 0.1))" },
  { keys: ["paypal"], label: "PayPal", icon: "P", accent: "#0070ba", gradient: "linear-gradient(135deg, rgba(0, 112, 186, 0.24), rgba(0, 48, 135, 0.1))" },
  { keys: ["linkedin"], label: "LinkedIn", icon: "in", accent: "#0a66c2", gradient: "linear-gradient(135deg, rgba(10, 102, 194, 0.24), rgba(0, 65, 130, 0.08))" },
  { keys: ["instagram"], label: "Instagram", icon: "IG", accent: "#e1306c", gradient: "linear-gradient(135deg, rgba(225, 48, 108, 0.24), rgba(253, 193, 53, 0.1), rgba(131, 58, 180, 0.1))" },
  { keys: ["facebook", "meta"], label: "Meta", icon: "f", accent: "#1877f2", gradient: "linear-gradient(135deg, rgba(24, 119, 242, 0.24), rgba(6, 88, 190, 0.1))" },
  { keys: ["slack"], label: "Slack", icon: "SL", accent: "#36c5f0", gradient: "linear-gradient(135deg, rgba(54, 197, 240, 0.22), rgba(46, 182, 125, 0.1), rgba(236, 178, 46, 0.08))" },
  { keys: ["notion"], label: "Notion", icon: "N", accent: "#f5f5f5", gradient: "linear-gradient(135deg, rgba(245, 245, 245, 0.16), rgba(63, 63, 70, 0.1))" },
  { keys: ["adobe"], label: "Adobe", icon: "A", accent: "#ff0000", gradient: "linear-gradient(135deg, rgba(255, 0, 0, 0.24), rgba(87, 0, 0, 0.1))" },
  { keys: ["openai", "chatgpt"], label: "OpenAI", icon: "AI", accent: "#10a37f", gradient: "linear-gradient(135deg, rgba(16, 163, 127, 0.24), rgba(52, 211, 153, 0.08))" },
  { keys: ["epic games", "epicgames"], label: "Epic Games", icon: "EP", accent: "#f5f5f5", gradient: "linear-gradient(135deg, rgba(245, 245, 245, 0.14), rgba(39, 39, 42, 0.2))" },
] as const;

const CATEGORY_SUGGESTIONS: {
  category: Category;
  keys: readonly string[];
}[] = [
  {
    category: "cloud",
    keys: ["aws", "azure", "icloud", "cloudflare", "digitalocean", "vercel"],
  },
  {
    category: "developer",
    keys: ["github", "gitlab", "bitbucket", "npm", "docker", "stackoverflow"],
  },
  {
    category: "ai",
    keys: ["openai", "chatgpt", "claude", "anthropic", "perplexity", "midjourney"],
  },
  {
    category: "email",
    keys: ["gmail", "outlook", "proton", "yahoo mail", "fastmail", "mail"],
  },
  {
    category: "gaming",
    keys: ["steam", "epic games", "epicgames", "xbox", "playstation", "nintendo"],
  },
  {
    category: "streaming",
    keys: ["netflix", "hulu", "disney", "youtube", "prime video", "max.com"],
  },
  {
    category: "music",
    keys: ["spotify", "apple music", "soundcloud", "tidal", "pandora"],
  },
  {
    category: "shopping",
    keys: ["amazon", "ebay", "etsy", "walmart", "target", "shopify"],
  },
  {
    category: "banking",
    keys: ["bank", "chase", "capital one", "amex", "visa", "mastercard", "paypal"],
  },
  {
    category: "social",
    keys: ["instagram", "facebook", "linkedin", "reddit", "discord", "twitch", "x.com"],
  },
  {
    category: "productivity",
    keys: ["notion", "slack", "asana", "trello", "linear", "todoist", "office"],
  },
  {
    category: "education",
    keys: ["coursera", "udemy", "khan", "school", "university", "duolingo"],
  },
  {
    category: "travel",
    keys: ["airbnb", "booking", "expedia", "airline", "delta", "united", "hotel"],
  },
  {
    category: "food",
    keys: ["doordash", "ubereats", "grubhub", "restaurant", "starbucks"],
  },
  {
    category: "health",
    keys: ["health", "mychart", "pharmacy", "cvs", "walgreens", "doctor"],
  },
  {
    category: "government",
    keys: ["irs", "ssa", "dmv", "gov", "passport"],
  },
  {
    category: "utilities",
    keys: ["electric", "water", "gas", "utility", "power", "internet bill"],
  },
  {
    category: "crypto",
    keys: ["coinbase", "binance", "kraken", "wallet", "crypto"],
  },
  {
    category: "insurance",
    keys: ["insurance", "geico", "progressive", "state farm", "allstate"],
  },
  {
    category: "telecom",
    keys: ["verizon", "at&t", "tmobile", "comcast", "xfinity", "spectrum"],
  },
  {
    category: "creator",
    keys: ["patreon", "substack", "medium", "canva", "figma", "adobe"],
  },
  {
    category: "security",
    keys: ["1password", "bitwarden", "lastpass", "authy", "yubico", "security"],
  },
];

export function getCategoryMeta(category: string) {
  return CATEGORY_META[category as Category] ?? CATEGORY_META.other;
}

export function suggestAccountCategory(account: {
  name: string;
  url?: string;
}): Category {
  const haystack = `${account.name} ${account.url ?? ""}`.toLowerCase();
  const match = CATEGORY_SUGGESTIONS.find((suggestion) =>
    suggestion.keys.some((key) => haystack.includes(key)),
  );
  return match?.category ?? "other";
}

export function getAccountVisual(account: {
  name: string;
  url?: string;
  category: string;
  customColor?: string;
}) {
  const base = getCategoryMeta(account.category);
  const haystack = `${account.name} ${account.url ?? ""}`.toLowerCase();
  const brand = BRAND_THEMES.find((theme) =>
    theme.keys.some((key) => haystack.includes(key)),
  );
  const customColor = normalizeHexColor(account.customColor);

  if (customColor) {
    return {
      ...base,
      accent: customColor,
      customGradient: `linear-gradient(135deg, ${hexToRgba(customColor, 0.28)}, ${hexToRgba(customColor, 0.08)})`,
      customBadgeStyle: getBadgeStyle(customColor),
      brandLabel: brand?.label,
    };
  }

  if (brand) {
    return {
      ...base,
      icon: brand.icon,
      label: brand.label,
      accent: brand.accent,
      customGradient: brand.gradient,
      customBadgeStyle: getBadgeStyle(brand.accent),
      brandLabel: brand.label,
    };
  }

  return {
    ...base,
    customGradient: undefined,
    customBadgeStyle: undefined,
    brandLabel: undefined,
  };
}

export function getAccountQualityHints(account: {
  username?: string;
  email?: string;
  url?: string;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  recoveryEmail?: string;
  tags?: string[];
}) {
  const hints: {
    key: string;
    label: string;
    tone: "warning" | "muted" | "good";
  }[] = [];

  if (!account.hasPassword) {
    hints.push({ key: "no-password", label: "No password", tone: "warning" });
  }
  if (!account.username && !account.email) {
    hints.push({ key: "no-login", label: "No login", tone: "warning" });
  }
  if (!account.url) {
    hints.push({ key: "no-url", label: "No URL", tone: "muted" });
  }
  if (!account.twoFactorEnabled) {
    hints.push({ key: "no-2fa", label: "No 2FA", tone: "muted" });
  }
  if (!account.recoveryEmail) {
    hints.push({ key: "no-recovery", label: "No recovery", tone: "muted" });
  }
  if (!account.tags?.length) {
    hints.push({ key: "no-tags", label: "No tags", tone: "muted" });
  }

  return hints;
}

export function isAccountNeedsReview(account: {
  username?: string;
  email?: string;
  hasPassword?: boolean;
  twoFactorEnabled?: boolean;
  recoveryEmail?: string;
}) {
  return (
    !account.hasPassword ||
    (!account.username && !account.email) ||
    !account.twoFactorEnabled ||
    !account.recoveryEmail
  );
}

export function normalizeHexColor(color?: string): string {
  if (!color) return "";
  const trimmed = color.trim();
  return /^#[0-9a-fA-F]{6}$/.test(trimmed) ? trimmed : "";
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

function getBadgeStyle(color: string) {
  return {
    backgroundColor: hexToRgba(color, 0.16),
    borderColor: hexToRgba(color, 0.34),
    color,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
