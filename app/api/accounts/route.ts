import type { NextRequest } from "next/server";
import { getAllAccounts, createAccount, CATEGORIES } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await getAllAccounts();
  return Response.json(accounts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, username, email, password, url, category, notes } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return Response.json(
      { error: "Account name is required" },
      { status: 400 },
    );
  }
  if (category && !CATEGORIES.includes(category)) {
    return Response.json({ error: "Invalid category" }, { status: 400 });
  }

  const account = await createAccount({
    name: name.trim(),
    username: (username ?? "").trim(),
    email: (email ?? "").trim(),
    password: password ?? "",
    url: (url ?? "").trim(),
    category: category ?? "other",
    notes: (notes ?? "").trim(),
  });

  return Response.json(account, { status: 201 });
}
