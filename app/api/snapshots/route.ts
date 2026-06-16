import {
  createAtlasSnapshot,
  getSnapshotStatus,
  restoreLatestSnapshotToLocal,
} from "@/lib/snapshotManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getSnapshotStatus();
  return Response.json(status);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string };

    if (body.action === "create") {
      const snapshot = await createAtlasSnapshot();
      const status = await getSnapshotStatus();
      return Response.json({ snapshot, status });
    }

    if (body.action === "restore-local") {
      const restore = await restoreLatestSnapshotToLocal();
      const status = await getSnapshotStatus();
      return Response.json({ restore, status });
    }

    return Response.json({ error: "Unsupported snapshot action" }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Snapshot operation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
