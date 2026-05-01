"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

type Action = { type: "ADD"; toast: Toast } | { type: "REMOVE"; id: string };

function reducer(state: Toast[], action: Action): Toast[] {
  if (action.type === "ADD") return [...state, action.toast];
  if (action.type === "REMOVE") return state.filter((t) => t.id !== action.id);
  return state;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<ToastType, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  error: "border-red-500/40 bg-red-500/10 text-red-400",
  warning: "border-amber-500/40 bg-amber-500/10 text-amber-400",
  info: "border-indigo-500/40 bg-indigo-500/10 text-indigo-400",
};

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const Icon = ICONS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div
      ref={ref}
      className={`flex items-start gap-3 w-80 rounded-2xl border px-4 py-3.5 shadow-2xl backdrop-blur-xl animate-slide-in ${STYLES[toast.type]}`}
      style={{ background: "rgba(9,9,11,0.85)" }}
    >
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-zinc-600 hover:text-zinc-300 transition-colors shrink-0 mt-0.5"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);

  const remove = useCallback((id: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = crypto.randomUUID();
      dispatch({ type: "ADD", toast: { id, type, title, message } });
    },
    [],
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={remove} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}
