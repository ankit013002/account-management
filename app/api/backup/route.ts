import { getAllAccountsRaw, importAccounts } from "@/lib/db";
import { decryptBackup, encryptBackup, type EncryptedBackup } from "@/lib/backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const accounts = await getAllAccountsRaw();
  const backup = encryptBackup({
    version: 1,
    exportedAt: new Date().toISOString(),
    accounts,
  });

  return Response.json(backup, {
    headers: {
      "Content-Disposition": `attachment; filename="account-management-backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

export async function POST(request: Request) {
  try {
    const backup = (await request.json()) as EncryptedBackup;
    const payload = decryptBackup(backup);
    const imported = await importAccounts(payload.accounts);
    return Response.json({ imported });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid backup";
    return Response.json({ error: message }, { status: 400 });
  }
}
