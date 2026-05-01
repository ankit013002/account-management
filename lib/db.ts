import { Schema, model, models } from "mongoose";
import { encrypt, decrypt } from "./encryption";
import { connectToDatabase } from "./mongodb";

export const CATEGORIES = [
  "email",
  "shopping",
  "social",
  "banking",
  "work",
  "gaming",
  "streaming",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Account {
  id: string;
  name: string;
  username: string;
  email: string;
  password: string; // stored encrypted
  url: string;
  category: Category;
  notes: string;
  tags: string[];
  recoveryEmail: string;
  backupCodes: string;
  twoFactorEnabled: boolean;
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountInput {
  name: string;
  username: string;
  email: string;
  password: string; // plain text
  url: string;
  category: Category;
  notes: string;
  tags?: string[];
  recoveryEmail?: string;
  backupCodes?: string;
  twoFactorEnabled?: boolean;
  favorite?: boolean;
}

export interface AccountPublic extends Omit<Account, "password"> {
  hasPassword: boolean;
}

export interface AuditEvent {
  id: string;
  action: "created" | "viewed" | "updated" | "deleted" | "imported";
  accountId: string;
  accountName: string;
  createdAt: string;
}

const accountSchema = new Schema<Account>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, default: "" },
    email: { type: String, default: "" },
    password: { type: String, default: "" },
    url: { type: String, default: "" },
    category: {
      type: String,
      enum: CATEGORIES,
      default: "other",
    },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
    recoveryEmail: { type: String, default: "" },
    backupCodes: { type: String, default: "" },
    twoFactorEnabled: { type: Boolean, default: false },
    favorite: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
    updatedAt: { type: String, required: true },
  },
  {
    collection: "accounts",
    versionKey: false,
  },
);

const AccountModel =
  models.Account || model<Account>("Account", accountSchema);

const auditSchema = new Schema<AuditEvent>(
  {
    id: { type: String, required: true, unique: true, index: true },
    action: {
      type: String,
      enum: ["created", "viewed", "updated", "deleted", "imported"],
      required: true,
    },
    accountId: { type: String, required: true },
    accountName: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  {
    collection: "audit_events",
    versionKey: false,
  },
);

const AuditModel =
  models.AuditEvent || model<AuditEvent>("AuditEvent", auditSchema);

function toAccount(doc: Account): Account {
  return {
    id: doc.id,
    name: doc.name,
    username: doc.username ?? "",
    email: doc.email ?? "",
    password: doc.password ?? "",
    url: doc.url ?? "",
    category: doc.category ?? "other",
    notes: doc.notes ?? "",
    tags: doc.tags ?? [],
    recoveryEmail: doc.recoveryEmail ?? "",
    backupCodes: doc.backupCodes ?? "",
    twoFactorEnabled: doc.twoFactorEnabled ?? false,
    favorite: doc.favorite ?? false,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toPublic(account: Account): AccountPublic {
  const { password, ...rest } = account;
  return {
    ...rest,
    hasPassword: !!password,
  };
}

export async function getAllAccounts(): Promise<AccountPublic[]> {
  await connectToDatabase();
  const docs = await AccountModel.find().sort({ createdAt: -1 }).lean<Account[]>();
  return docs.map((doc) => toPublic(toAccount(doc)));
}

export async function getAllAccountsRaw(): Promise<Account[]> {
  await connectToDatabase();
  const docs = await AccountModel.find().sort({ createdAt: -1 }).lean<Account[]>();
  return docs.map((doc) => toAccount(doc));
}

export async function getAccountById(id: string): Promise<Account | null> {
  await connectToDatabase();
  const doc = await AccountModel.findOne({ id }).lean<Account>();
  return doc ? toAccount(doc) : null;
}

export function getDecryptedAccount(
  account: Account,
): Account & { decryptedPassword: string } {
  return {
    ...account,
    decryptedPassword: decrypt(account.password),
  };
}

export async function createAccount(
  input: AccountInput,
): Promise<AccountPublic> {
  await connectToDatabase();
  const now = new Date().toISOString();
  const account: Account = {
    id: crypto.randomUUID(),
    name: input.name,
    username: input.username,
    email: input.email,
    password: input.password ? encrypt(input.password) : "",
    url: input.url,
    category: input.category,
    notes: input.notes,
    tags: input.tags ?? [],
    recoveryEmail: input.recoveryEmail ?? "",
    backupCodes: input.backupCodes ?? "",
    twoFactorEnabled: input.twoFactorEnabled ?? false,
    favorite: input.favorite ?? false,
    createdAt: now,
    updatedAt: now,
  };
  await AccountModel.create(account);
  await recordAuditEvent("created", account.id, account.name);
  return toPublic(account);
}

export async function updateAccount(
  id: string,
  input: Partial<AccountInput>,
): Promise<AccountPublic | null> {
  await connectToDatabase();
  const existing = await AccountModel.findOne({ id }).lean<Account>();
  if (!existing) return null;

  const update: Partial<Account> = {
    name: input.name ?? existing.name,
    username: input.username ?? existing.username,
    email: input.email ?? existing.email,
    password: input.password ? encrypt(input.password) : existing.password,
    url: input.url ?? existing.url,
    category: input.category ?? existing.category,
    notes: input.notes ?? existing.notes,
    tags: input.tags ?? existing.tags ?? [],
    recoveryEmail: input.recoveryEmail ?? existing.recoveryEmail ?? "",
    backupCodes: input.backupCodes ?? existing.backupCodes ?? "",
    twoFactorEnabled:
      input.twoFactorEnabled ?? existing.twoFactorEnabled ?? false,
    favorite: input.favorite ?? existing.favorite ?? false,
    updatedAt: new Date().toISOString(),
  };

  const updated = await AccountModel.findOneAndUpdate({ id }, update, {
    new: true,
  }).lean<Account>();
  if (updated) {
    await recordAuditEvent("updated", id, updated.name);
  }
  return updated ? toPublic(toAccount(updated)) : null;
}

export async function deleteAccount(id: string): Promise<boolean> {
  await connectToDatabase();
  const existing = await AccountModel.findOne({ id }).lean<Account>();
  const result = await AccountModel.deleteOne({ id });
  if (result.deletedCount === 1 && existing) {
    await recordAuditEvent("deleted", id, existing.name);
  }
  return result.deletedCount === 1;
}

export async function importAccounts(accounts: Account[]): Promise<number> {
  await connectToDatabase();
  let count = 0;
  for (const account of accounts) {
    await AccountModel.findOneAndUpdate({ id: account.id }, toAccount(account), {
      upsert: true,
      new: true,
    });
    await recordAuditEvent("imported", account.id, account.name);
    count++;
  }
  return count;
}

export async function recordAuditEvent(
  action: AuditEvent["action"],
  accountId: string,
  accountName: string,
): Promise<void> {
  await connectToDatabase();
  await AuditModel.create({
    id: crypto.randomUUID(),
    action,
    accountId,
    accountName,
    createdAt: new Date().toISOString(),
  });
}

export async function getRecentAuditEvents(limit = 8): Promise<AuditEvent[]> {
  await connectToDatabase();
  const docs = await AuditModel.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<AuditEvent[]>();
  return docs.map((doc) => ({
    id: doc.id,
    action: doc.action,
    accountId: doc.accountId,
    accountName: doc.accountName,
    createdAt: doc.createdAt,
  }));
}

/** Returns all accounts with decrypted passwords - for RAG context only */
export async function getAllAccountsDecrypted(): Promise<
  (Account & { decryptedPassword: string })[]
> {
  await connectToDatabase();
  const docs = await AccountModel.find().sort({ createdAt: -1 }).lean<Account[]>();
  return docs.map((doc) => {
    const account = toAccount(doc);
    return {
      ...account,
      decryptedPassword: decrypt(account.password),
    };
  });
}
