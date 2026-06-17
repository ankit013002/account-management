import Link from "next/link";
import {
  Contact,
  FileText,
  HardDrive,
  HeartHandshake,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import PrintButton from "@/components/PrintButton";
import { getAllAccounts, getAllVaultItems } from "@/lib/db";

export const dynamic = "force-dynamic";

const CRITICAL_TAGS = ["critical", "emergency", "important", "family"];
const CRITICAL_CATEGORIES = [
  "banking",
  "government",
  "insurance",
  "security",
  "crypto",
  "health",
];

export default async function EmergencyKitPage() {
  const [accounts, items] = await Promise.all([
    getAllAccounts(),
    getAllVaultItems(),
  ]);
  const criticalAccounts = accounts.filter(
    (account) =>
      account.favorite ||
      CRITICAL_CATEGORIES.includes(account.category) ||
      account.tags.some((tag) => CRITICAL_TAGS.includes(tag.toLowerCase())),
  );
  const emergencyItems = items.filter(
    (item) =>
      item.type === "emergency" ||
      item.type === "contact" ||
      item.tags.some((tag) => CRITICAL_TAGS.includes(tag.toLowerCase())),
  );
  const documents = items.filter((item) => item.type === "document");
  const devices = items.filter((item) => item.type === "device");

  return (
    <div className="flex flex-col gap-6 p-6 pl-16 md:p-8 print:p-0">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 print:text-black">
            Emergency Kit
          </h1>
          <p className="mt-1 text-sm text-zinc-500 print:text-zinc-700">
            A password-free handoff map for critical accounts, contacts,
            documents, and devices.
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200 print:border-zinc-300 print:bg-white print:text-zinc-800">
        This page intentionally does not print passwords. It shows where
        important things live, which accounts matter, and what needs to be
        recovered first.
      </div>

      <KitSection
        title="Critical Accounts"
        icon={<KeyRound className="h-4 w-4" />}
        empty="Mark important accounts as favorites or tag them critical/emergency."
      >
        {criticalAccounts.map((account) => (
          <Link
            key={account.id}
            href={`/accounts/${account.id}`}
            className="rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-3 transition-colors hover:border-zinc-700 print:border-zinc-300 print:bg-white"
          >
            <p className="font-medium text-zinc-100 print:text-black">
              {account.name}
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {[account.email || account.username, account.url, account.category]
                .filter(Boolean)
                .join(" - ")}
            </p>
          </Link>
        ))}
      </KitSection>

      <KitSection
        title="Emergency Contacts And Notes"
        icon={<HeartHandshake className="h-4 w-4" />}
        empty="Add emergency contacts or notes in Command Center."
      >
        {emergencyItems.map((item) => (
          <KitItem key={item.id} item={item} icon={<Contact className="h-4 w-4" />} />
        ))}
      </KitSection>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KitSection
          title="Important Documents"
          icon={<FileText className="h-4 w-4" />}
          empty="Track passports, insurance cards, IDs, leases, and warranties."
        >
          {documents.map((item) => (
            <KitItem
              key={item.id}
              item={item}
              icon={<FileText className="h-4 w-4" />}
            />
          ))}
        </KitSection>

        <KitSection
          title="Devices"
          icon={<HardDrive className="h-4 w-4" />}
          empty="Track serial numbers, purchase dates, warranties, and backup notes."
        >
          {devices.map((item) => (
            <KitItem
              key={item.id}
              item={item}
              icon={<HardDrive className="h-4 w-4" />}
            />
          ))}
        </KitSection>
      </div>

      <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 print:border-zinc-300 print:bg-white">
        <div className="mb-4 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-300 print:text-zinc-800" />
          <h2 className="text-sm font-semibold text-zinc-100 print:text-black">
            Recovery Checklist
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {[
            "Locate the device with authenticator apps.",
            "Confirm recovery email access first.",
            "Use account pages in Vault for current login metadata.",
            "Restore encrypted backup only with the correct encryption key.",
            "Update financial, government, and insurance contacts first.",
            "Review subscriptions and pause unnecessary renewals.",
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-3 text-sm text-zinc-400 print:border-zinc-300 print:bg-white print:text-zinc-800"
            >
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function KitSection({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode[];
}) {
  const hasItems = children.length > 0;
  return (
    <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/50 p-5 print:border-zinc-300 print:bg-white">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-indigo-300 print:text-zinc-800">{icon}</span>
        <h2 className="text-sm font-semibold text-zinc-100 print:text-black">
          {title}
        </h2>
      </div>
      {hasItems ? (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{children}</div>
      ) : (
        <p className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 px-3 py-4 text-center text-sm text-zinc-600 print:border-zinc-300 print:bg-white">
          {empty}
        </p>
      )}
    </section>
  );
}

function KitItem({
  item,
  icon,
}: {
  item: {
    title: string;
    provider: string;
    location: string;
    identifier: string;
    notes: string;
    tags: string[];
  };
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-800/60 bg-zinc-950/30 p-3 print:border-zinc-300 print:bg-white">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-indigo-300 print:text-zinc-800">{icon}</span>
        <div className="min-w-0">
          <p className="font-medium text-zinc-100 print:text-black">
            {item.title}
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            {[item.provider, item.location, item.identifier]
              .filter(Boolean)
              .join(" - ")}
          </p>
          {item.notes && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-400 print:text-zinc-800">
              {item.notes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
