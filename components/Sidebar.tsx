"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Shield,
  LayoutDashboard,
  PlusCircle,
  MessageSquare,
  Menu,
  X,
  Lock,
} from "lucide-react";
import LockButton from "./LockButton";
import BackupControls from "./BackupControls";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/accounts/new",
    label: "Add Account",
    icon: PlusCircle,
    exact: false,
  },
  { href: "/chat", label: "AI Assistant", icon: MessageSquare, exact: false },
];

function NavLinks({
  pathname,
  onClick,
}: {
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {nav.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onClick}
            className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
              isActive
                ? "bg-indigo-500/15 text-indigo-400 shadow-sm shadow-indigo-500/10"
                : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60"
            }`}
          >
            <span
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                isActive
                  ? "bg-indigo-500/20 text-indigo-400"
                  : "bg-zinc-800/60 text-zinc-500 group-hover:bg-zinc-700/60 group-hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
            </span>
            {label}
            {isActive && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({
  pathname,
  onNavClick,
  showClose,
  onClose,
}: {
  pathname: string;
  onNavClick?: () => void;
  showClose?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-5 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-100 leading-tight tracking-tight">
              Vault
            </p>
            <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">
              Account Manager
            </p>
          </div>
        </div>
        {showClose && (
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <NavLinks pathname={pathname} onClick={onNavClick} />

      <div className="px-4 py-4 border-t border-zinc-800/60">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="text-[11px] text-emerald-400/70 font-medium">
            AES-256-GCM encrypted
          </span>
        </div>
        <BackupControls />
        <LockButton />
      </div>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <Menu className="w-4 h-4" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-[#0d0d10] border-r border-zinc-800/60 transform transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onNavClick={() => setMobileOpen(false)}
          showClose
          onClose={() => setMobileOpen(false)}
        />
      </aside>

      <aside className="hidden md:flex h-screen w-60 flex-col bg-[#0d0d10] border-r border-zinc-800/60 shrink-0 sticky top-0">
        <SidebarContent pathname={pathname} />
      </aside>
    </>
  );
}
