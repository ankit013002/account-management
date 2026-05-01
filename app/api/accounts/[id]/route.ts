import type { NextRequest } from "next/server";
import {
  getAccountById,
  updateAccount,
  deleteAccount,
  getDecryptedAccount,
  recordAuditEvent,
} from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const account = await getAccountById(id);
  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  await recordAuditEvent("viewed", id, account.name);
  const decrypted = getDecryptedAccount(account);
  return Response.json({
    ...decrypted,
    password: decrypted.decryptedPassword,
    decryptedPassword: undefined,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const updated = await updateAccount(id, body);
  if (!updated) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await deleteAccount(id);
  if (!deleted) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }
  return Response.json({ success: true });
}
