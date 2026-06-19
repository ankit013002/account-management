import { getAllAccounts, getAllVaultItems } from "@/lib/db";
import { isAccountNeedsReview } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [accounts, items] = await Promise.all([
    getAllAccounts(),
    getAllVaultItems(),
  ]);
  const activeItems = items.filter((item) => item.status !== "archived");
  const subscriptions = activeItems.filter(
    (item) => item.type === "subscription",
  );
  const dueSoon = activeItems.filter((item) => getDueState(item) === "soon");
  const overdue = activeItems.filter((item) => getDueState(item) === "overdue");
  const needsReview = accounts.filter((account) =>
    isAccountNeedsReview(account),
  );

  return Response.json({
    accounts: accounts.length,
    vaultItems: items.length,
    needsReview: needsReview.length,
    overdue: overdue.length,
    dueSoon: dueSoon.length,
    subscriptions: subscriptions.length,
    monthlySpend: subscriptions.reduce(
      (total, item) => total + item.monthlyCost,
      0,
    ),
  });
}

function getDueState(item: { dueDate: string; renewalDate: string }) {
  const date = item.renewalDate || item.dueDate;
  if (!date) return "none";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${date}T00:00:00`);
  const days = (due.getTime() - today.getTime()) / 86_400_000;
  if (days < 0) return "overdue";
  if (days <= 30) return "soon";
  return "later";
}
