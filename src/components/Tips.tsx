"use client";

import { useEffect } from "react";

export default function Tips({ open, onClose }: { open: boolean; onClose: () => void }) {
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === "Escape") onClose();
        }
        if (open) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
            <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[92vw] max-w-2xl max-h-[85vh] overflow-y-auto nice-scroll rounded-2xl border bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 text-neutral-100 shadow-2xl ring-1 ring-neutral-800">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-semibold">Tips & Strategies</h2>
                    <button onClick={onClose} className="h-8 w-8 rounded-full bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800">✕</button>
                </div>
                <div className="space-y-4 text-sm">
                    <p className="text-neutral-300">Quick ideas to win more games in Nox Chess:</p>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-300">
                        <li>During a match, tap twice on a piece on mobile or double-click on desktop to quickly view its abilities.</li>
                        <li>Bank your Dream Energy (DE) for pivotal Nightfall turns. Threat and tempo matter more than small trades.</li>
                        <li>Force exchanges during Calm phase if you're ahead in material. Avoid them if you're setting up an ability combo.</li>
                        <li>Scout fork and pin patterns unique to custom pieces. Practice recognizing their threat shapes.</li>
                        <li>Advance with purpose: push pieces that convert DE into direct threats instead of moving everything a little.</li>
                        <li>Trade off enemy pieces with high Nightfall phase impact before they can snowball DE advantages.</li>
                        <li>Control central lanes to maximize ability reach and piece mobility during Nightfall phase.</li>
                    </ul>
                    <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
                        <h3 className="font-medium mb-1">Practice drills</h3>
                        <ul className="list-disc pl-5 text-neutral-300 space-y-1">
                            <li>Play mock turns where you plan two moves ahead: Calm setup → Nightfall execution.</li>
                            <li>Pick one piece and learn two concrete ability sequences you can reuse.</li>
                            <li>Review lost games: find the first turn you lost initiative and why.</li>
                        </ul>
                    </div>
                    <p className="text-xs text-neutral-400">Close this dialog to return. Press Esc anytime.</p>
                </div>
            </div>
        </div>
    );
}
