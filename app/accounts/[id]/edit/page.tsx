import { getAccountById, getDecryptedAccount } from "@/lib/db";
import AccountForm from "@/components/AccountForm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EditAccountPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const raw = await getAccountById(id);
  if (!raw) notFound();
  const account = getDecryptedAccount(raw);

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 pl-16 md:pl-8">
      <Link
        href={`/accounts/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to {account.name}
      </Link>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Edit Account
        </h1>
        <p className="text-xs text-zinc-600 mt-1.5">
          Leave password blank to keep the current one.
        </p>
      </div>
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6">
        <AccountForm
          mode="edit"
          account={{ ...account, hasPassword: !!raw.password, password: "" }}
        />
      </div>
    </div>
  );
}
