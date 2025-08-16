import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PIECE_IMAGES } from "@/constants";
import { BoardCell, BoardType, PieceImagesType } from "@/types";
import { useMatch } from "@/contexts/MatchContext";
import { getSocket } from "@/lib/socket";
import PieceAbilities from "./PieceAbilities";

const Board = ({ board }: { board: BoardType | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const { myColor, currentTurnColor, finished, setCurrentTurnColor, setBoard: setBoardCtx, whiteMs, blackMs, setWhiteMs, setBlackMs, clocksSyncedAt, setClocksSyncedAt } = useMatch();
    const [selected, setSelected] = useState<{ x: number; y: number; pieceId: number } | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [hints, setHints] = useState<Array<{ x: number; y: number }>>([]);
    const [pendingMove, setPendingMove] = useState(false);
    const [abilityPiece, setAbilityPiece] = useState<any | null>(null);
    const boardSnapshotRef = useRef<BoardType | null>(null);
    const clocksSnapshotRef = useRef<{ whiteMs: number | null; blackMs: number | null; clocksSyncedAt: number | null; turnColor: "white" | "black" | null } | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Orient rows so the current player is at the bottom; default is white bottom if unknown
    const orientedRows = useMemo(() => {
        if (!board) return [] as BoardType;
        // Server stores y=0 as White back rank (bottom). For UI, map top->bottom order.
        // White perspective: bottom should be y=0 -> reverse rows
        // Black perspective: bottom should be y=7 -> keep rows as-is
        if (myColor === "black") return board;
        return [...board].slice().reverse() as BoardType;
    }, [board, myColor]);

    const attemptMove = useCallback(async (from: { x: number; y: number; pieceId: number }, to: { x: number; y: number }) => {
    if (!myColor) return; // color unknown, avoid sending
    if (finished) return; // no moves after finish
        if (pendingMove) return; // prevent concurrent optimistic moves
        if (currentTurnColor !== myColor) {
            setLastError("not_your_turn");
            return;
        }
        if (!board) return;

        // Snapshot board and clocks/turn before optimistic change
        const prevBoard: BoardType = board.map(row => (row ? row.slice() : row)) as BoardType;
        boardSnapshotRef.current = prevBoard;
        clocksSnapshotRef.current = { whiteMs, blackMs, clocksSyncedAt, turnColor: currentTurnColor };

        // Apply optimistic board update
        const nextBoard: BoardType = board.map(row => (row ? row.slice() : row)) as BoardType;
        const moving = nextBoard[from.y]?.[from.x] || null;
        if (!moving) return; // should not happen
        // Place piece at destination and clear source
        if (!nextBoard[to.y]) return;
        nextBoard[to.y][to.x] = moving;
        nextBoard[from.y][from.x] = null;
        setBoardCtx(nextBoard);
        // Hide selection and hints immediately during optimistic phase
        setSelected(null);
        setHints([]);

        // Apply optimistic clock change: commit elapsed for myColor and hand turn to opponent
        try {
            const now = Date.now();
            const elapsed = clocksSyncedAt != null ? Math.max(0, now - clocksSyncedAt) : 0;
            if (myColor === "white") {
                const newWhite = (whiteMs ?? 0) - elapsed;
                setWhiteMs(Math.max(0, newWhite));
                setBlackMs(blackMs ?? null);
            } else {
                const newBlack = (blackMs ?? 0) - elapsed;
                setBlackMs(Math.max(0, newBlack));
                setWhiteMs(whiteMs ?? null);
            }
            setClocksSyncedAt(now);
            setCurrentTurnColor(myColor === "white" ? "black" : "white");
        } catch { }

        setPendingMove(true);
        try {
            const s = await getSocket();
            await new Promise<void>((resolve) => {
                s.emit("move:attempt", { pieceId: from.pieceId, from: { x: from.x, y: from.y }, to }, (ack: any) => {
                    if (!ack?.ok) {
                        setLastError(ack?.error || "illegal_move");
                        // Revert optimistic state
                        const prevB = boardSnapshotRef.current;
                        const prevC = clocksSnapshotRef.current;
                        if (prevB) setBoardCtx(prevB);
                        if (prevC) {
                            setWhiteMs(prevC.whiteMs ?? null);
                            setBlackMs(prevC.blackMs ?? null);
                            setClocksSyncedAt(prevC.clocksSyncedAt ?? null);
                            setCurrentTurnColor(prevC.turnColor);
                        }
                    } else {
                        setLastError(null);
                    }
                    resolve();
                });
            });
        } catch (e: any) {
            setLastError(e?.message || "connection_error");
            // Revert optimistic state on transport error
            const prevB = boardSnapshotRef.current;
            const prevC = clocksSnapshotRef.current;
            if (prevB) setBoardCtx(prevB);
            if (prevC) {
                setWhiteMs(prevC.whiteMs ?? null);
                setBlackMs(prevC.blackMs ?? null);
                setClocksSyncedAt(prevC.clocksSyncedAt ?? null);
                setCurrentTurnColor(prevC.turnColor);
            }
        } finally {
            setSelected(null);
            setHints([]);
            setPendingMove(false);
        }
    }, [myColor, pendingMove, currentTurnColor, board, setBoardCtx, whiteMs, blackMs, clocksSyncedAt, setWhiteMs, setBlackMs, setClocksSyncedAt, setCurrentTurnColor]);

    // Generate simple pseudo-legal hints (server still validates). Covers basic chess-like moves and occupancy rules.
    const computeHints = useCallback((from: { x: number; y: number; pieceId: number }) => {
        if (!board) return [] as Array<{ x: number; y: number }[]>;
        const p = board[from.y]?.[from.x];
        if (!p) return [] as any;
        const type = p.type;
        const color = p.color as "white" | "black";
        const inside = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;
        const at = (x: number, y: number) => (inside(x, y) ? board[y]?.[x] ?? null : null);
        const res: Array<{ x: number; y: number }> = [];

        const pushIf = (x: number, y: number) => {
            const c = at(x, y);
            if (c == null || c?.color !== color) res.push({ x, y });
        };
        const rays = (dirs: Array<[number, number]>) => {
            for (const [dx, dy] of dirs) {
                let x = from.x + dx, y = from.y + dy;
                while (inside(x, y)) {
                    const c = at(x, y);
                    if (c == null) {
                        res.push({ x, y });
                    } else {
                        if (c.color !== color) res.push({ x, y });
                        break;
                    }
                    x += dx; y += dy;
                }
            }
        };

        switch (type) {
            case "SLEEPLESS_EYE": { // king
                for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const x = from.x + dx, y = from.y + dy; if (!inside(x, y)) continue; pushIf(x, y);
                }
                break;
            }
            case "PHANTOM_MATRIARCH": // queen
                rays([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
            case "SHADOW_HUNTER": // rook
                rays([[1, 0], [-1, 0], [0, 1], [0, -1]]);
                break;
            case "DOPPELGANGER": // bishop by default
                rays([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
            case "PHOBIC_LEAPER": { // knight
                const ds = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
                for (const [dx, dy] of ds) {
                    const x = from.x + dx, y = from.y + dy; if (!inside(x, y)) continue; pushIf(x, y);
                }
                break;
            }
            case "PSYCHIC_LARVA": { // pawn
                const dir = color === "white" ? 1 : -1;
                const f1y = from.y + dir;
                if (inside(from.x, f1y) && at(from.x, f1y) == null) res.push({ x: from.x, y: f1y });
                const startRow = color === "white" ? 1 : 6;
                const f2y = from.y + 2 * dir;
                if (from.y === startRow && at(from.x, f1y) == null && inside(from.x, f2y) && at(from.x, f2y) == null) res.push({ x: from.x, y: f2y });
                // captures
                for (const dx of [-1, 1] as const) {
                    const x = from.x + dx, y = from.y + dir; if (!inside(x, y)) continue; const c = at(x, y); if (c && c.color !== color) res.push({ x, y });
                }
                break;
            }
        }
        return res;
    }, [board]);

    if (!board) {
        return (
            <div className="flex justify-center items-center h-[70vh]">
                <div className="space-y-3 text-center">
                    <div className="mx-auto w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    // Centralized ability opener (used by long-press, right-click, and the small button)
    const openAbilities = useCallback((p: BoardCell | null) => {
        if (p && p.color) setAbilityPiece(p);
    }, []);

    return (
        <>
            <div className="flex flex-col items-center">
                <div
                    className={`mx-auto bg-gray-900/80 rounded-lg overflow-hidden ring-1 ring-neutral-800 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                    style={{
                        aspectRatio: "1 / 1",
                        maxWidth: "min(90vw, 90vh - 8rem)"
                    }}
                >
                    <div className="grid h-full w-full">
                        {orientedRows.map((row, rowIdxVisual) => {
                            const actualRowIdx = myColor === "black" ? rowIdxVisual : 7 - rowIdxVisual;
                            return (
                                <div key={rowIdxVisual} className="grid grid-cols-8">
                                    {row.map((_cell, colIdxVisual) => {
                                        const actualColIdx = myColor === "black" ? 7 - colIdxVisual : colIdxVisual;
                                        const cell = row[actualColIdx];
                                        const isDark = (actualRowIdx + actualColIdx) % 2 === 1;
                                        const isMine = !!cell?.color && (!!myColor ? cell.color === myColor : false);
                                        const isSelected = selected?.x === actualColIdx && selected?.y === actualRowIdx;
                                        return (
                                            <div
                                                key={colIdxVisual}
                                                className={`aspect-square flex justify-center items-center relative
                                                    ${isDark ? "bg-gray-800" : "bg-gray-900"}
                                                    ${isSelected ? "border border-zinc-500" : ""}
                                                    ${cell && isMine ? "cursor-pointer" : "cursor-default"}
                                                    transition-colors duration-150`}
                                                onClick={() => {
                                                    // Removed: opening abilities on click (so moves aren’t blocked)
                                                    if (finished) return;
                                                    if (pendingMove) return;
                                                    if (!myColor) return;

                                                    if (cell && cell.color && isMine) {
                                                        setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                                        if (currentTurnColor === myColor) setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
                                                        else setHints([]);
                                                        return;
                                                    }
                                                    if (selected && (selected.x !== actualColIdx || selected.y !== actualRowIdx)) {
                                                        attemptMove({ x: selected.x, y: selected.y, pieceId: selected.pieceId }, { x: actualColIdx, y: actualRowIdx });
                                                    } else {
                                                        setSelected(null);
                                                        setHints([]);
                                                    }
                                                }}
                                                onDragOver={(e) => {
                                                    if (pendingMove) return;
                                                    if (selected) e.preventDefault();
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    if (finished) return;
                                                    if (pendingMove) return;
                                                    if (!selected) return;
                                                    attemptMove({ x: selected.x, y: selected.y, pieceId: selected.pieceId }, { x: actualColIdx, y: actualRowIdx });
                                                }}
                                            >
                                                {cell && cell.color && (
                                                    <Cell
                                                        mappedImages={PIECE_IMAGES}
                                                        cell={cell}
                                                        isMine={isMine}
                                                        onDragStart={() => {
                                                            if (pendingMove) return;
                                                            if (!myColor || !isMine) return;
                                                            setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                                            if (currentTurnColor === myColor) setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
                                                            else setHints([]);
                                                        }}
                                                        onOpenAbilities={() => openAbilities(cell)}
                                                    />
                                                )}

                                                {/* Ability button for the selected piece (tap to open) */}
                                                {isSelected && cell && (
                                                    <button
                                                        className="absolute top-1 right-1 h-6 w-6 rounded-md bg-black/60 text-fuchsia-200 ring-1 ring-neutral-800 hover:bg-black/80"
                                                        onClick={(e) => { e.stopPropagation(); openAbilities(cell); }}
                                                        aria-label="Show abilities"
                                                        title="Show abilities"
                                                    >
                                                        ☽
                                                    </button>
                                                )}

                                                {/* Move hint dot (hidden while a move is pending) */}
                                                {!pendingMove && hints.some(h => h.x === actualColIdx && h.y === actualRowIdx) && (
                                                    <span className="absolute w-3 h-3 rounded-full bg-foreground" style={{ pointerEvents: "none" }}></span>
                                                )}

                                                {/* Coordinates */}
                                                {rowIdxVisual === 7 && (
                                                    <span className="absolute bottom-0.5 right-1 text-[8px] text-foreground">
                                                        {String.fromCharCode(97 + (myColor === "black" ? 7 - colIdxVisual : colIdxVisual))}
                                                    </span>
                                                )}
                                                {colIdxVisual === 0 && (
                                                    <span className="absolute top-0.5 left-1 text-[8px] text-foreground">
                                                        {myColor === "black" ? rowIdxVisual + 1 : 8 - rowIdxVisual}
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
                {lastError && (
                    <div className="mt-2 text-center text-xs text-red-400">{lastError}</div>
                )}
            </div>

            <PieceAbilities
                piece={abilityPiece}
                onClose={() => setAbilityPiece(null)}
            />
        </>
    );
};

// Double-tap (mobile) + right-click (desktop) to open abilities
const Cell = ({
    mappedImages,
    cell,
    isMine,
    onDragStart,
    onOpenAbilities,
}: {
    mappedImages: PieceImagesType;
    cell: BoardCell | null;
    isMine: boolean;
    onDragStart: () => void;
    onOpenAbilities: () => void;
}) => {
    if (!cell || !cell.color) return null;
    // Track double-tap without interfering with drag: do not open if the finger moved.
    const lastTapTsRef = useRef<number>(0);
    const movedRef = useRef<boolean>(false);

    return (
        <img
            src={mappedImages[cell.type][cell.color]}
            alt={`${cell.color} ${cell.type}`}
            className={`w-4/5 h-4/5 object-contain select-none ${isMine ? "pointer-events-auto" : "pointer-events-none"}`}
            draggable={isMine}
            onDragStart={(e) => {
                if (!isMine) return;
                try { e.dataTransfer?.setData("text/plain", String(cell.id)); } catch { }
                onDragStart();
            }}
            onContextMenu={(e) => {
                e.preventDefault();
                onOpenAbilities();
            }}
            onTouchStart={() => {
                movedRef.current = false;
            }}
            onTouchMove={() => {
                movedRef.current = true; // user is dragging or scrolling, don't trigger double-tap
            }}
            onTouchEnd={(e) => {
                // If the touch moved, treat as drag/scroll and ignore
                if (movedRef.current) return;
                const now = Date.now();
                const dt = now - lastTapTsRef.current;
                lastTapTsRef.current = now;
                if (dt > 0 && dt < 260) {
                    // Considered a double-tap: open abilities and stop the click
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenAbilities();
                }
            }}
            onTouchCancel={() => {
                movedRef.current = false;
            }}
        />
    );
}

export default Board;