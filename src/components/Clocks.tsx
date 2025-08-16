"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "@/contexts/MatchContext";

function format(ms: number) {
    const clamped = Math.max(0, Math.floor(ms));
    const m = Math.floor(clamped / 60000);
    const s = Math.floor((clamped % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Clocks() {
    const { myColor, currentTurnColor, whiteMs, blackMs, clocksSyncedAt, whiteDE, blackDE } = useMatch();
    const [now, setNow] = useState<number>(() => Date.now());
    const raf = useRef<number | null>(null);

    // Drive a lightweight timer only when a clock is running
    useEffect(() => {
        function tick() {
            setNow(Date.now());
            raf.current = requestAnimationFrame(tick);
        }
        // run only if we have clocks and it's someone's turn
        if (whiteMs != null && blackMs != null && currentTurnColor) {
            raf.current = requestAnimationFrame(tick);
            return () => { if (raf.current) cancelAnimationFrame(raf.current); };
        }
    }, [whiteMs, blackMs, currentTurnColor]);

    const [whiteDisplay, blackDisplay] = useMemo(() => {
        if (whiteMs == null || blackMs == null) return [null, null] as const;
        const baseNow = clocksSyncedAt ?? now;
        const elapsed = Math.max(0, now - baseNow);

        // Only the side to move is ticking client-side; the server re-syncs on updates
        const white = currentTurnColor === "white" ? whiteMs - elapsed : whiteMs;
        const black = currentTurnColor === "black" ? blackMs - elapsed : blackMs;
        return [Math.max(0, white), Math.max(0, black)] as const;
    }, [whiteMs, blackMs, currentTurnColor, clocksSyncedAt, now]);

    const whiteLabel = myColor === "white" ? "You" : "Opponent";
    const blackLabel = myColor === "black" ? "You" : "Opponent";

    const maxDE = 20;
    const deBar = (val: number | null) => {
        const v = Math.max(0, Math.min(maxDE, val ?? 0));
        const pct = (v / maxDE) * 100;
        return (
            <div className="mt-1 h-2 w-full bg-neutral-800 rounded overflow-hidden" aria-label="Dream Energy">
                <div className="h-full bg-fuchsia-500" style={{ width: `${pct}%` }} />
            </div>
        );
    };

    return (
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className={`rounded-md border px-3 py-2 ${currentTurnColor === "white" ? "border-emerald-500" : "border-gray-700"}`}>
                <div className="flex items-center justify-between">
                    <div className="text-gray-400">{whiteLabel} (White)</div>
                    <div className="text-xs text-fuchsia-200">DE {whiteDE ?? "--"}/{maxDE}</div>
                </div>
                <div className="text-xl font-mono">{whiteDisplay == null ? "--:--" : format(whiteDisplay)}</div>
                {deBar(whiteDE)}
            </div>
            <div className={`rounded-md border px-3 py-2 ${currentTurnColor === "black" ? "border-emerald-500" : "border-gray-700"}`}>
                <div className="flex items-center justify-between">
                    <div className="text-gray-400">{blackLabel} (Black)</div>
                    <div className="text-xs text-fuchsia-200">DE {blackDE ?? "--"}/{maxDE}</div>
                </div>
                <div className="text-xl font-mono">{blackDisplay == null ? "--:--" : format(blackDisplay)}</div>
                {deBar(blackDE)}
            </div>
        </div>
    );
}
