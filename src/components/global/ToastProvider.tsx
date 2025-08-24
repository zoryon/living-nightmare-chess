"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

type ToastVariant = "info" | "success" | "error" | "warning";
export type Toast = {
    id: string;
    title: string;
    description?: string;
    variant?: ToastVariant;
    durationMs?: number;
};

type ToastContextType = {
    show: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
    return ctx;
}

function ToastCard({ t, onClose }: { t: Toast; onClose: (id: string) => void }) {
    const variant = t.variant || "info";
    const ring = variant === "error" ? "ring-red-500/40" : variant === "success" ? "ring-emerald-500/40" : variant === "warning" ? "ring-amber-500/40" : "ring-sky-500/30";
    const bg = variant === "error" ? "bg-red-900/30" : variant === "success" ? "bg-emerald-900/30" : variant === "warning" ? "bg-amber-900/30" : "bg-sky-900/30";
    const dot = variant === "error" ? "bg-red-400" : variant === "success" ? "bg-emerald-400" : variant === "warning" ? "bg-amber-400" : "bg-sky-400";
    return (
        <div className={`pointer-events-auto w-80 rounded-lg ${bg} ring-1 ${ring} text-slate-100 shadow-xl backdrop-blur-md`}
            role="status" aria-live="polite">
            <div className="p-3">
                <div className="flex items-start gap-3">
                    <span className={`mt-1 inline-block h-2.5 w-2.5 rounded-full ${dot}`} />
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium leading-tight">{t.title}</div>
                        {t.description && (
                            <div className="mt-0.5 text-xs text-slate-300 leading-snug">{t.description}</div>
                        )}
                    </div>
                    <button onClick={() => onClose(t.id)} aria-label="Close notification" className="text-slate-300 hover:text-slate-100">
                        x
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

    const remove = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        const tm = timeoutsRef.current[id];
        if (tm) {
            clearTimeout(tm);
            delete timeoutsRef.current[id];
        }
    }, []);

    const show = useCallback((toast: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).slice(2);
        const t: Toast = { id, durationMs: 4000, variant: "info", ...toast };
        setToasts((prev) => [t, ...prev].slice(0, 5));
        const tm = setTimeout(() => remove(id), t.durationMs);
        timeoutsRef.current[id] = tm as unknown as NodeJS.Timeout;
    }, [remove]);

    const value = useMemo(() => ({ show }), [show]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* Overlay container */}
            <div className="pointer-events-none fixed top-4 right-4 z-[1000] flex flex-col gap-2">
                {toasts.map((t) => (
                    <ToastCard key={t.id} t={t} onClose={remove} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}
