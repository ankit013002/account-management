import { VAULT_ITEM_TYPES } from "./db";

const STATUSES = ["active", "watching", "paused", "archived"] as const;

export function validateVaultItemBody(body: Record<string, unknown>) {
  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return "Title is required";
  }
  if (!body.type || !VAULT_ITEM_TYPES.includes(body.type as never)) {
    return "Invalid vault item type";
  }
  if (body.status && !STATUSES.includes(body.status as never)) {
    return "Invalid vault item status";
  }
  return "";
}

export function normalizeVaultItemBody(body: Record<string, unknown>) {
  return {
    type: body.type as (typeof VAULT_ITEM_TYPES)[number],
    title: String(body.title ?? "").trim(),
    provider: String(body.provider ?? "").trim(),
    accountId: String(body.accountId ?? "").trim(),
    url: String(body.url ?? "").trim(),
    status: (body.status || "active") as
      | "active"
      | "watching"
      | "paused"
      | "archived",
    monthlyCost: Number(body.monthlyCost ?? 0) || 0,
    dueDate: String(body.dueDate ?? ""),
    renewalDate: String(body.renewalDate ?? ""),
    location: String(body.location ?? "").trim(),
    identifier: String(body.identifier ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
    tags: Array.isArray(body.tags)
      ? body.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
  };
}
