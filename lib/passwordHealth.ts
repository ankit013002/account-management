import type { Account } from "./db";
import { getPasswordStrength } from "./password";

type DecryptedAccount = Account & { decryptedPassword: string };

export interface PasswordHealthItem {
  id: string;
  name: string;
  reason: string;
}

export interface PasswordHealthReport {
  total: number;
  strong: number;
  weak: PasswordHealthItem[];
  reused: PasswordHealthItem[];
  missing: PasswordHealthItem[];
  stale: PasswordHealthItem[];
  score: number;
}

const STALE_AFTER_DAYS = 365;

function daysSince(value: string): number {
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 0;
  return Math.floor((Date.now() - time) / 86_400_000);
}

export function getPasswordHealthReport(
  accounts: DecryptedAccount[],
): PasswordHealthReport {
  const passwordGroups = new Map<string, DecryptedAccount[]>();
  for (const account of accounts) {
    if (!account.decryptedPassword) continue;
    const group = passwordGroups.get(account.decryptedPassword) ?? [];
    group.push(account);
    passwordGroups.set(account.decryptedPassword, group);
  }

  const weak: PasswordHealthItem[] = [];
  const missing: PasswordHealthItem[] = [];
  const stale: PasswordHealthItem[] = [];
  let strong = 0;

  for (const account of accounts) {
    if (!account.decryptedPassword) {
      missing.push({
        id: account.id,
        name: account.name,
        reason: "No saved password",
      });
      continue;
    }

    const strength = getPasswordStrength(account.decryptedPassword);
    if (strength.level >= 4) {
      strong++;
    } else if (strength.level <= 2) {
      weak.push({
        id: account.id,
        name: account.name,
        reason: `${strength.label || "Weak"} password`,
      });
    }

    const age = daysSince(account.updatedAt || account.createdAt);
    if (age >= STALE_AFTER_DAYS) {
      stale.push({
        id: account.id,
        name: account.name,
        reason: `${age} days since last update`,
      });
    }
  }

  const reused = [...passwordGroups.values()]
    .filter((group) => group.length > 1)
    .flatMap((group) =>
      group.map((account) => ({
        id: account.id,
        name: account.name,
        reason: `Reused across ${group.length} accounts`,
      })),
    );

  const issueCount = weak.length + reused.length + missing.length + stale.length;
  const score =
    accounts.length === 0
      ? 100
      : Math.max(0, Math.round(100 - (issueCount / accounts.length) * 20));

  return {
    total: accounts.length,
    strong,
    weak,
    reused,
    missing,
    stale,
    score,
  };
}
