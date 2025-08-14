import { useCallback, useEffect, useMemo, useState } from "react";

import { PIECE_IMAGES } from "@/constants";
import { BoardCell, BoardType, PieceImagesType } from "@/types";
import { useMatch } from "@/contexts/MatchContext";
import { getSocket } from "@/lib/socket";

const Board = ({ board }: { board: BoardType | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const { myColor, currentTurnColor } = useMatch();
    const [selected, setSelected] = useState<{ x: number; y: number; pieceId: number } | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [hints, setHints] = useState<Array<{ x: number; y: number }>>([]);

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
        try {
            const s = await getSocket();
            await new Promise<void>((resolve) => {
                s.emit("move:attempt", { pieceId: from.pieceId, from: { x: from.x, y: from.y }, to }, (ack: any) => {
                    if (!ack?.ok) {
                        setLastError(ack?.error || "illegal_move");
                    } else {
                        setLastError(null);
                    }
                    resolve();
                });
            });
        } catch (e: any) {
            setLastError(e?.message || "connection_error");
        } finally {
            setSelected(null);
            setHints([]);
        }
    }, [myColor]);

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
                rays([[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
                break;
            case "SHADOW_HUNTER": // rook
                rays([[1,0],[-1,0],[0,1],[0,-1]]);
                break;
            case "DOPPELGANGER": // bishop by default
                rays([[1,1],[1,-1],[-1,1],[-1,-1]]);
                break;
            case "PHOBIC_LEAPER": { // knight
                const ds = [[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];
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
                const f2y = from.y + 2*dir;
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

    return (
        <div className="flex flex-col items-center">
        <div
            className={`mx-auto bg-gray-800 rounded-lg overflow-hidden transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'
                }`}
            style={{
                aspectRatio: "1 / 1",
                maxWidth: "min(90vw, 90vh - 8rem)"
            }}
        >
            <div className="grid h-full w-full">
                {orientedRows.map((row, rowIdxVisual) => {
                    // Map visual row to actual board row depending on orientation
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
                                        ${isDark ? "bg-gray-700" : "bg-gray-800"}
                                        ${isSelected ? "ring-2 ring-indigo-400" : ""}
                                        ${cell && isMine ? "cursor-pointer" : "cursor-default"}
                                        transition-colors duration-150`}
                                    onClick={() => {
                                        // Allow selection only of my pieces
                                        if (!myColor) return;
                                        // Selecting own piece on own turn => compute hints
                                        if (cell && cell.color && isMine) {
                                            setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                            if (currentTurnColor === myColor) setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
                                            else setHints([]);
                                            return;
                                        }
                                        // If we have a selected piece and click a destination (empty or enemy), try move
                                        if (selected && (selected.x !== actualColIdx || selected.y !== actualRowIdx)) {
                                            attemptMove({ x: selected.x, y: selected.y, pieceId: selected.pieceId }, { x: actualColIdx, y: actualRowIdx });
                                        } else {
                                            setSelected(null);
                                            setHints([]);
                                        }
                                    }}
                                    onDragOver={(e) => {
                                        if (selected) e.preventDefault(); // allow drop
                                    }}
                                    onDrop={(e) => {
                                        e.preventDefault();
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
                                                if (!myColor || !isMine) return;
                                                setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                                if (currentTurnColor === myColor) setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
                                                else setHints([]);
                                            }}
                                        />
                                    )}

                                    {/* Move hint dot */}
                                    {hints.some(h => h.x === actualColIdx && h.y === actualRowIdx) && (
                                        <span className="absolute w-3 h-3 rounded-full bg-indigo-400/80" style={{ pointerEvents: "none" }}></span>
                                    )}

                                    {/* Coordinates */}
                    {rowIdxVisual === 7 && (
                                        <span className="absolute bottom-0.5 right-1 text-[8px] text-gray-500">
                        {String.fromCharCode(97 + (myColor === "black" ? 7 - colIdxVisual : colIdxVisual))}
                                        </span>
                                    )}
                                    {colIdxVisual === 0 && (
                                        <span className="absolute top-0.5 left-1 text-[8px] text-gray-500">
                        {myColor === "black" ? rowIdxVisual + 1 : 8 - rowIdxVisual}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                );})}
            </div>
        </div>
        {lastError && (
            <div className="mt-2 text-center text-xs text-red-400">{lastError}</div>
        )}
        </div>
    );
};

const Cell = ({ mappedImages, cell, isMine, onDragStart }: { mappedImages: PieceImagesType; cell: BoardCell | null; isMine: boolean; onDragStart: () => void; }) => {
    if (!cell || !cell.color) return null;

    return (
        <img
            src={mappedImages[cell.type][cell.color]}
            alt={`${cell.color} ${cell.type}`}
            className={`w-4/5 h-4/5 object-contain select-none ${isMine ? "pointer-events-auto" : "pointer-events-none"}`}
            draggable={isMine}
            onDragStart={(e) => {
                if (!isMine) return;
                try { e.dataTransfer?.setData("text/plain", String(cell.id)); } catch {}
                onDragStart();
            }}
        />
    );
}

export default Board;