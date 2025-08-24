"use client";

import { useMemo, useState } from "react";
import { useMatch } from "@/contexts/MatchContext";
import { BoardType } from "@/types";
import { getSocket } from "@/lib/socket";

type Props = {
    larvaId: number;
    onClose: () => void;
};

const SUMMON_OPTIONS = [
    "PHANTOM_MATRIARCH",
    "SHADOW_HUNTER",
    "DOPPELGANGER",
    "PHOBIC_LEAPER",
] as const;

export default function PromotionModal({ larvaId, onClose }: Props) {
    const { board, myColor } = useMatch();
    const [mode, setMode] = useState<"SUMMON" | "INFEST">("SUMMON");
    const [choice, setChoice] = useState<{
        pieceType?: typeof SUMMON_OPTIONS[number];
        positions?: { x: number; y: number }[];
    }>({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const infestRowY = useMemo(() => (myColor === "white" ? 0 : 7), [myColor]);

    const emptyColsOnStartRow = useMemo(() => {
        if (!board) return [] as number[];
        const res: number[] = [];
        for (let x = 0; x < 8; x++) {
            if (board[infestRowY]?.[x] == null) res.push(x);
        }
        return res;
    }, [board, infestRowY]);

    const canInfest = emptyColsOnStartRow.length >= 3;

    async function submit() {
        if (submitting) return;
        setError(null);
        try {
            setSubmitting(true);
            const s = await getSocket();
            if (mode === "SUMMON") {
                if (!choice.pieceType) {
                    setError("Pick a piece type");
                    setSubmitting(false);
                    return;
                }
                await new Promise<void>((resolve) => {
                    s.emit(
                        "promotion:resolve",
                        { larvaId, choice: { type: "SUMMON", pieceType: choice.pieceType } },
                        (ack: any) => {
                            if (!ack?.ok) setError(ack?.error || "failed");
                            else onClose();
                            resolve();
                        }
                    );
                });
            } else {
                const pos = choice.positions ?? [];
                if (pos.length !== 3) {
                    setError("Select three positions");
                    setSubmitting(false);
                    return;
                }
                await new Promise<void>((resolve) => {
                    s.emit(
                        "promotion:resolve",
                        { larvaId, choice: { type: "INFEST", positions: pos } },
                        (ack: any) => {
                            if (!ack?.ok) setError(ack?.error || "failed");
                            else onClose();
                            resolve();
                        }
                    );
                });
            }
        } catch (e: any) {
            setError(e?.message || "connection_error");
        } finally {
            setSubmitting(false);
        }
    }

    function toggleInfestCol(x: number) {
        const y = infestRowY;
        const cur = choice.positions ?? [];
        const exists = cur.find((p) => p.x === x && p.y === y);
        if (exists) {
            setChoice({ ...choice, positions: cur.filter((p) => !(p.x === x && p.y === y)) });
        } else {
            if (cur.length >= 3) return; // cap at three
            setChoice({ ...choice, positions: [...cur, { x, y }] });
        }
    }

    return (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-5/6 max-w-lg text-gray-100">
                <h2 className="text-lg font-semibold mb-3">Corrupted Promotion</h2>
                <div className="flex gap-2 mb-4">
                    <button
                        className={`px-3 py-1 rounded ${mode === "SUMMON" ? "bg-indigo-600" : "bg-gray-700 hover:bg-gray-600"}`}
                        onClick={() => {
                            setMode("SUMMON");
                            setError(null);
                        }}
                    >Summon</button>
                    <button
                        className={`px-3 py-1 rounded ${mode === "INFEST" ? "bg-indigo-600" : "bg-gray-700 hover:bg-gray-600"}`}
                        onClick={() => {
                            setMode("INFEST");
                            setError(null);
                        }}
                        disabled={!canInfest}
                        title={!canInfest ? "Need three empty squares on your back rank" : undefined}
                    >Infest</button>
                </div>

                {mode === "SUMMON" ? (
                    <div>
                        <p className="text-sm text-gray-300 mb-2">Choose a piece to summon on the Larva's square.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {SUMMON_OPTIONS.map((opt) => (
                                <button
                                    key={opt}
                                    className={`px-3 py-2 rounded border ${choice.pieceType === opt ? "border-indigo-400 bg-indigo-600/20" : "border-gray-600 bg-gray-700 hover:bg-gray-600"}`}
                                    onClick={() => setChoice({ pieceType: opt })}
                                >
                                    {formatPiece(opt)}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div>
                        <p className="text-sm text-gray-300 mb-2">Pick three empty squares on your back rank.</p>
                        <RowPicker
                            board={board}
                            rowY={infestRowY}
                            selected={(choice.positions ?? []).map((p) => p.x)}
                            onToggle={toggleInfestCol}
                        />
                    </div>
                )}

                {error && <div className="mt-3 text-sm text-red-400">{error}</div>}

                <div className="flex justify-end gap-2 mt-4">
                    <button className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600" onClick={onClose} disabled={submitting}>Cancel</button>
                    <button className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50" disabled={submitting || (mode === "INFEST" && (choice.positions?.length ?? 0) !== 3) || (mode === "SUMMON" && !choice.pieceType)} onClick={submit}>
                        {submitting ? "Submitting…" : "Confirm"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RowPicker({ board, rowY, selected, onToggle }: { board: BoardType | null; rowY: number; selected: number[]; onToggle: (x: number) => void; }) {
    const cols = Array.from({ length: 8 }, (_, i) => i);
    return (
        <div className="grid grid-cols-8 gap-1">
            {cols.map((x) => {
                const empty = board?.[rowY]?.[x] == null;
                const label = String.fromCharCode(97 + x);
                const isSel = selected.includes(x);
                return (
                    <button
                        key={x}
                        className={`px-2 py-3 text-sm rounded border text-center ${empty ? (isSel ? "border-indigo-400 bg-indigo-600/30" : "border-gray-600 bg-gray-700 hover:bg-gray-600") : "border-gray-800 bg-gray-900 text-gray-500 cursor-not-allowed"}`}
                        onClick={() => empty && onToggle(x)}
                        disabled={!empty}
                        title={empty ? `Select ${label}${8 - rowY}` : "Occupied"}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}

function formatPiece(k: string) {
    switch (k) {
        case "PHANTOM_MATRIARCH":
            return "Phantom Matriarch";
        case "SHADOW_HUNTER":
            return "Shadow Hunter";
        case "DOPPELGANGER":
            return "Doppelgänger";
        case "PHOBIC_LEAPER":
            return "Phobic Leaper";
        default:
            return k;
    }
}
