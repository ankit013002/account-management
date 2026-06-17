import type { NextRequest } from "next/server";
import { getAccountsByDomain } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get("domain") ?? "";
  const accounts = await getAccountsByDomain(domain);
  return Response.json(
    accounts.slice(0, 5).map((account) => ({
      id: account.id,
      name: account.name,
      username: account.username,
      email: account.email,
      url: account.url,
      category: account.category,
      favorite: account.favorite,
    })),
  );
}
