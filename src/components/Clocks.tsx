"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMatch } from "@/contexts/MatchContext";
import { getSocket } from "@/lib/socket";

function format(ms: number) {
    const clamped = Math.max(0, Math.floor(ms));
    const m = Math.floor(clamped / 60000);
    const s = Math.floor((clamped % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function PhaseDesc({ phase }: { phase: "CALM" | "SHADOWS" | "UNSTABLE" | "CHAOS" }) {
    switch (phase) {
        case "CALM": return <span>Standard rules only. Abilities disabled.</span>;
        case "SHADOWS": return <span>Abilities enabled.</span>;
        case "UNSTABLE": return <span>Each turn, one random square is dangerous. Ending there immobilizes the piece next own turn.</span>;
        case "CHAOS": return <span>Dream Energy tripled and abilities refreshed. Field of Fear radius increases.</span>;
    }
}

export default function Clocks() {
    const { myColor, currentTurnColor, whiteMs, blackMs, clocksSyncedAt, whiteDE, blackDE, phase, nextPhase, finished } = useMatch();
    const [now, setNow] = useState<number>(() => Date.now());
    const raf = useRef<number | null>(null);
    const [meditatePending, setMeditatePending] = useState(false);
    const [meditateError, setMeditateError] = useState<string | null>(null);

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

    // If client-side computed time hits zero for the side to move, ask server to validate/end
    useEffect(() => {
        if (whiteDisplay == null || blackDisplay == null) return;
        const running = currentTurnColor === "white" ? whiteDisplay : currentTurnColor === "black" ? blackDisplay : null;
        if (running != null && running <= 0) {
            (async () => {
                try {
                    const s = await getSocket();
                    s.emit("clock:probe", {}, () => {});
                } catch {}
            })();
        }
    }, [whiteDisplay, blackDisplay, currentTurnColor]);

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
            <div className="col-span-2 mt-2 rounded-md border border-gray-700 px-3 py-2 text-xs text-gray-200">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <div className="text-gray-400">Nightmare Phase</div>
                        <div className="font-medium">{phase ?? "--"}</div>
                        {phase && <div className="text-gray-300 mt-1"><PhaseDesc phase={phase} /></div>}
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400">Next</div>
                        <div className="font-medium">{nextPhase?.name ?? "--"}</div>
                        {nextPhase && <div className="text-gray-300 mt-1">in {Math.max(0, nextPhase.inTurns)} turn{(nextPhase.inTurns ?? 0) === 1 ? "" : "s"}</div>}
                    </div>
                </div>
            </div>
            {/* Actions: Meditate */}
            <div className="col-span-2 flex items-center justify-between gap-3">
                <div className="text-xs text-neutral-400">Actions</div>
                <div className="flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-700/20 text-emerald-100 ring-1 ring-emerald-600/50 hover:bg-emerald-700/30 disabled:opacity-40"
                        disabled={finished || !myColor || currentTurnColor !== myColor || meditatePending}
                        onClick={async () => {
                            setMeditateError(null);
                            setMeditatePending(true);
                            try {
                                const s = await getSocket();
                                await new Promise<void>((resolve) => {
                                    s.emit("turn:meditate", {}, (ack: any) => {
                                        if (!ack?.ok) setMeditateError(ack?.error || "meditate_failed");
                                        resolve();
                                    });
                                });
                            } catch (e: any) {
                                setMeditateError(e?.message || "connection_error");
                            } finally {
                                setMeditatePending(false);
                            }
                        }}
                        title="Gain +8 DE and end your turn (not allowed in check)"
                        aria-label="Meditate"
                    >
                        {meditatePending ? (
                            <>
                                <span className="inline-block h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                Meditating…
                            </>
                        ) : (
                            <>Meditate</>
                        )}
                    </button>
                </div>
            </div>
            {meditateError && (
                <div className="col-span-2 text-xs text-red-400">{meditateError}</div>
            )}
        </div>
    );
}
