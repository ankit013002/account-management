import type { NextRequest } from "next/server";
import {
  deleteVaultItem,
  getVaultItemById,
  updateVaultItem,
} from "@/lib/db";
import {
  normalizeVaultItemBody,
  validateVaultItemBody,
} from "@/lib/vaultItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const item = await getVaultItemById(id);
  if (!item) {
    return Response.json({ error: "Vault item not found" }, { status: 404 });
  }
  return Response.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const existing = await getVaultItemById(id);
  if (!existing) {
    return Response.json({ error: "Vault item not found" }, { status: 404 });
  }
  const next = { ...existing, ...body };
  const validation = validateVaultItemBody(next);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  const updated = await updateVaultItem(id, normalizeVaultItemBody(next));
  return Response.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await deleteVaultItem(id);
  if (!deleted) {
    return Response.json({ error: "Vault item not found" }, { status: 404 });
  }
  return Response.json({ success: true });
}
