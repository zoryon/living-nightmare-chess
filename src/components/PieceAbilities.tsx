"use client";

import { useMemo } from "react";
import * as PC from "@/constants";
import { CatalogEntry, PieceLike } from "@/types";

function getPiecesCatalog(): Record<string, CatalogEntry> {
    const candidates = [
        (PC as any).PIECES,
        (PC as any).PIECES_MAP,
        (PC as any).default,
        (PC as any),
    ];
    for (const c of candidates) {
        if (
            c &&
            typeof c === "object" &&
            Object.values(c).some(
                (v: any) => v && typeof v === "object" && ("activeAbility" in v || "passiveAbility" in v)
            )
        ) {
            return c as Record<string, CatalogEntry>;
        }
    }
    return {};
}

function normalizeKey(s: string) {
    return s.replace(/[^\w]+/g, "_").replace(/_+/g, "_").toUpperCase();
}

const SLUG_TO_KEY: Record<string, string> = {
    "sleepless-eye": "SLEEPLESS_EYE",
    "phantom-matriarch": "PHANTOM_MATRIARCH",
    "shadow-hunter": "SHADOW_HUNTER",
    "doppelganger": "DOPPELGANGER",
    "phobic-leaper": "PHOBIC_LEAPER",
    "psychic-larva": "PSYCHIC_LARVA",
    // accents / alt names
    "doppelgänger": "DOPPELGANGER",
};

function resolveCatalogKey(piece?: PieceLike | null) {
    if (!piece) return null;
    const candStrs = [
        piece.slug,
        piece.kind,
        piece.type,
        piece.code,
        piece.name,
    ].filter(Boolean) as string[];

    // Try slug map first
    for (const s of candStrs) {
        const key = SLUG_TO_KEY[s.toLowerCase()] || SLUG_TO_KEY[s.toLowerCase().replace(/\s+/g, "-")];
        if (key) return key;
    }
    // Try normalized UPPER_SNAKE
    for (const s of candStrs) {
        const key = normalizeKey(s);
        if (key in getPiecesCatalog()) return key;
    }
    return null;
}

export default function PieceAbilities({
    piece,
    onClose,
}: {
    piece: PieceLike | null;
    onClose: () => void;
}) {
    const catalog = useMemo(getPiecesCatalog, []);
    const key = useMemo(() => resolveCatalogKey(piece), [piece]);
    const entry = key ? catalog[key] : undefined;

    if (!piece || !entry) return null;

    const sideAccent = piece.color === "white" ? "from-indigo-400/40" : "from-fuchsia-500/30";
    const title = entry.name || piece.name || key;

    return (
        <>
            {/* Backdrop */}
            <button
                aria-label="Close abilities"
                onClick={onClose}
                className="fixed inset-0 z-[49] bg-black/40 backdrop-blur-sm md:bg-black/20"
            />
            {/* Panel */}
            <section
                role="dialog"
                aria-modal="true"
                className={[
                    "fixed z-[50] text-sm text-neutral-100",
                    // Mobile bottom sheet / Desktop side card
                    "inset-x-0 bottom-0 md:inset-y-8 md:right-8 md:left-auto",
                    "rounded-t-2xl md:rounded-2xl",
                    "shadow-2xl ring-1 ring-neutral-800/60",
                    // Living Nightmare theme
                    "bg-gradient-to-b md:bg-gradient-to-br",
                    sideAccent,
                    "via-neutral-900 to-black",
                    "p-4 md:p-5",
                    // Keep it concise and non-scrolly
                    "max-h-[42vh] md:max-h-[70vh] overflow-hidden",
                    "w-full md:w-[360px]",
                ].join(" ")}
            >
                <div className="flex items-center justify-between gap-3 mb-3 md:mb-4">
                    <div className="min-w-0">
                        <p className="uppercase tracking-wider text-[10px] text-fuchsia-400/90">Living Nightmare</p>
                        <h3 className="truncate text-lg md:text-xl font-semibold text-fuchsia-200">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/70 ring-1 ring-neutral-800 text-neutral-300 hover:bg-neutral-800"
                        aria-label="Close"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 md:gap-4">
                    {entry.activeAbility && (
                        <article className="rounded-xl ring-1 ring-neutral-800 bg-black/40 p-3">
                            <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-5 items-center rounded px-2 text-[10px] font-medium bg-fuchsia-700/30 text-fuchsia-200 ring-1 ring-fuchsia-700/50">
                                        Active
                                    </span>
                                    <h4 className="font-medium text-fuchsia-100">{entry.activeAbility.name}</h4>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-fuchsia-200/90">
                                    {typeof entry.activeAbility.cost === "number" && (
                                        <span className="px-1.5 py-0.5 rounded bg-fuchsia-900/30 ring-1 ring-fuchsia-800/50">DE {entry.activeAbility.cost}</span>
                                    )}
                                    {typeof entry.activeAbility.maxUses === "number" && (
                                        <span className="px-1.5 py-0.5 rounded bg-fuchsia-900/30 ring-1 ring-fuchsia-800/50">x{entry.activeAbility.maxUses}</span>
                                    )}
                                </div>
                            </div>
                            {entry.activeAbility.description && (
                                <p className="text-neutral-300/90">{entry.activeAbility.description}</p>
                            )}
                        </article>
                    )}

                    {entry.passiveAbility && (
                        <article className="rounded-xl ring-1 ring-neutral-800 bg-black/40 p-3">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className="inline-flex h-5 items-center rounded px-2 text-[10px] font-medium bg-indigo-700/30 text-indigo-200 ring-1 ring-indigo-700/50">
                                    Passive
                                </span>
                                <h4 className="font-medium text-indigo-100">{entry.passiveAbility.name}</h4>
                            </div>
                            {entry.passiveAbility.description && (
                                <p className="text-neutral-300/90">{entry.passiveAbility.description}</p>
                            )}
                        </article>
                    )}
                </div>

                <p className="mt-3 text-[11px] text-neutral-400/80">
                    Tap outside or hit ✕ to close.
                </p>
            </section>
        </>
    );
}