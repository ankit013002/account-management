import type { NextRequest } from "next/server";
import {
  createVaultItem,
  getAllVaultItems,
} from "@/lib/db";
import {
  normalizeVaultItemBody,
  validateVaultItemBody,
} from "@/lib/vaultItems";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getAllVaultItems();
  return Response.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const validation = validateVaultItemBody(body);
  if (validation) {
    return Response.json({ error: validation }, { status: 400 });
  }

  const item = await createVaultItem(normalizeVaultItemBody(body));
  return Response.json(item, { status: 201 });
}
