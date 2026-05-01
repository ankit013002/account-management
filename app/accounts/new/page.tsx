import AccountForm from "@/components/AccountForm";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function NewAccountPage() {
  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 pl-16 md:pl-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-300 transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Add Account</h1>
        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-zinc-600">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Password encrypted with AES-256-GCM before storage</span>
        </div>
      </div>
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-6">
        <AccountForm mode="create" />
      </div>
    </div>
  );
}