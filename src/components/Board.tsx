import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PIECE_IMAGES } from "@/constants";
import { BoardCell, BoardType, PieceImagesType } from "@/types";
import { useMatch } from "@/contexts/MatchContext";
import { getSocket } from "@/lib/socket";
import PieceAbilities from "@/components/PieceAbilities";

const Board = ({ board }: { board: BoardType | null }) => {
    const [isVisible, setIsVisible] = useState(false);
    const { myColor, currentTurnColor, finished, setCurrentTurnColor, setBoard: setBoardCtx, whiteMs, blackMs, setWhiteMs, setBlackMs, clocksSyncedAt, setClocksSyncedAt } = useMatch();
    const [selected, setSelected] = useState<{ x: number; y: number; pieceId: number } | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [hints, setHints] = useState<Array<{ x: number; y: number }>>([]);
    const [pendingMove, setPendingMove] = useState(false);
    const [abilityPiece, setAbilityPiece] = useState<any | null>(null);
    const [abilityArm, setAbilityArm] = useState<{
        pieceId: number;
        pieceType: string;
        abilityName: string;
        needsTarget: boolean;
    } | null>(null);
    const [abilityBusy, setAbilityBusy] = useState(false);
    const [postAbilitySelectId, setPostAbilitySelectId] = useState<number | null>(null);
    const [unstableLocal, setUnstableLocal] = useState<number[]>([]);
    // Local, per-client temporary movement overrides (e.g., Mimicry) before board status syncs
    const [mimicLocal, setMimicLocal] = useState<Record<number, string>>({});
    const [abilityTargets, setAbilityTargets] = useState<Array<{ x: number; y: number }>>([]);
    const boardSnapshotRef = useRef<BoardType | null>(null);
    const clocksSnapshotRef = useRef<{ whiteMs: number | null; blackMs: number | null; clocksSyncedAt: number | null; turnColor: "white" | "black" | null } | null>(null);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Orient rows so the current player is at the bottom; default is white bottom if unknown
    const orientedRows = useMemo(() => {
        if (!board) return [] as unknown as BoardType;
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
    // Enhanced: honors temporary movement override via status.mimic (from Doppelganger: Mimicry).
    const computeHints = useCallback((from: { x: number; y: number; pieceId: number }) => {
        if (!board) return [] as Array<{ x: number; y: number }>;
        const p = board[from.y]?.[from.x];
        if (!p) return [] as any;
        const type = p.type as string;
        const color = p.color as "white" | "black";
    const status: any = (p as any).status || {};
    // Prefer local override from recent Mimicry on this client; fall back to status from server sync
    const mimicOverride = mimicLocal[from.pieceId] ? String(mimicLocal[from.pieceId]).toLowerCase() : null;
    const mimicMove = mimicOverride || (typeof status.mimic === "string" ? (status.mimic as string).toLowerCase() : null);
    const unstablePendingTurn: number | undefined = status.unstablePendingTurn;
    // Only show Unstable forced-step options to the owner of the piece
    const unstableActive = (type === "DOPPELGANGER") && (color === myColor) && (unstablePendingTurn != null || unstableLocal.includes(from.pieceId));
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

        // Unstable Form (forced extra step): only 1-square diagonals, with restricted captures
        if (unstableActive) {
            const dirs: Array<[number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dx, dy] of dirs) {
                const x = from.x + dx, y = from.y + dy;
                if (!inside(x, y)) continue;
                const c = at(x, y);
                if (c == null) {
                    res.push({ x, y });
                } else {
                    if (c.color === color) continue; // cannot capture ally
                    // cannot capture enemy king during forced step
                    if ((c as any).type === "SLEEPLESS_EYE") continue;
                    // Only Larva or Doppelgänger capturable
                    const t = (c as any).type;
                    if (t === "PSYCHIC_LARVA" || t === "DOPPELGANGER") res.push({ x, y });
                }
            }
            return res;
        }

        // Helper to add moves based on a movement keyword
        const addByMovement = (movement: string) => {
            switch (movement) {
                case "king": {
                    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const x = from.x + dx, y = from.y + dy; if (!inside(x, y)) continue; pushIf(x, y);
                    }
                    break;
                }
                case "queen":
                    rays([[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]);
                    break;
                case "rook":
                    rays([[1, 0], [-1, 0], [0, 1], [0, -1]]);
                    break;
                case "bishop":
                    rays([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                    break;
                case "knight": {
                    const ds = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
                    for (const [dx, dy] of ds) {
                        const x = from.x + dx, y = from.y + dy; if (!inside(x, y)) continue; pushIf(x, y);
                    }
                    break;
                }
                case "pawn": {
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
                default:
                    break;
            }
        };

        // Mimicry movement applies only while it's the mover's turn (approximation without numeric turn)
        if (mimicMove && currentTurnColor && ((p as any).color === currentTurnColor)) {
            addByMovement(mimicMove);
            return res;
        }

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
            case "DOPPELGANGER":
                // Default bishop movement unless mimicking; already handled above for mimic
                rays([[1, 1], [1, -1], [-1, 1], [-1, -1]]);
                break;
            case "PHOBIC_LEAPER":
                addByMovement("knight");
                break;
            case "PSYCHIC_LARVA":
                addByMovement("pawn");
                break;
        }
        return res;
    }, [board, currentTurnColor, unstableLocal, mimicLocal, myColor]);

    // Note: Do not early-return here; render a spinner conditionally to keep hooks order stable.

    // Centralized ability opener (used by long-press, right-click, and the small button)
    const openAbilities = useCallback((p: BoardCell | null) => {
        if (p && p.color) setAbilityPiece(p);
    }, []);

    // Ability use helper (handles ack + errors)
    const sendAbility = useCallback(async (pieceId: number, abilityName: string, target?: any) => {
        setAbilityBusy(true);
        try {
            const s = await getSocket();
            await new Promise<void>((resolve) => {
                s.emit("ability:use", { pieceId, name: abilityName, target }, (ack: any) => {
                    if (!ack?.ok) setLastError(ack?.error || "ability_failed");
                    // Do not auto reselect/show hints on ack; ability:applied will manage visuals
                    resolve();
                });
            });
        } catch (e: any) {
            setLastError(e?.message || "connection_error");
        } finally {
            setAbilityBusy(false);
            setAbilityArm(null);
        }
    }, [board, computeHints]);

    // Esc to cancel arming
    useEffect(() => {
        if (!abilityArm) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setAbilityArm(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [abilityArm]);

    // Listen for ability:applied to trigger hints after Mimicry (movement override)
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const s = await getSocket();
                const onAbility = (payload: any) => {
                    if (!mounted) return;
                    // Clear any stale selection/hints on any ability broadcast
                    setSelected(null);
                    setHints([]);
                    setAbilityTargets([]);
                    // Mimicry: only the acting player should immediately see the new path; use server-provided movement as local override
                    if (payload?.ability === "Mimicry" && typeof payload.pieceId === "number") {
                        const pid = payload.pieceId as number;
                        const mv = typeof payload.movement === "string" ? payload.movement : null;
                        // Determine piece ownership from current board snapshot
                        let pieceColor: "white" | "black" | null = null;
                        if (board) {
                            outerFind: for (let y = 0; y < 8; y++) {
                                for (let x = 0; x < 8; x++) {
                                    const c = board[y]?.[x];
                                    if (c && c.id === pid) { pieceColor = (c.color as any) ?? null; break outerFind; }
                                }
                            }
                        }
                        // Only apply on the client that owns the piece
                        if (pieceColor && myColor && pieceColor === myColor) {
                            if (mv) setMimicLocal(prev => ({ ...prev, [pid]: mv }));
                            setPostAbilitySelectId(pid);
                        }
                    } else if (payload?.ability === "Ethereal Passage" && typeof payload.pieceId === "number") {
                        // Safe to highlight to acting player only as well
                        const pid = payload.pieceId as number;
                        let pieceColor: "white" | "black" | null = null;
                        if (board) {
                            outerEP: for (let y = 0; y < 8; y++) {
                                for (let x = 0; x < 8; x++) {
                                    const c = board[y]?.[x];
                                    if (c && c.id === pid) { pieceColor = (c.color as any) ?? null; break outerEP; }
                                }
                            }
                        }
                        if (pieceColor && myColor && pieceColor === myColor) setPostAbilitySelectId(pid);
                    } else if (payload?.ability === "Terror Leap") {
                        // Terror Leap completes immediately; ensure no stale path remains on either client
                        setSelected(null);
                        setHints([]);
                        setAbilityTargets([]);
                    }
                };
                const onMoveApplied = (payload: any) => {
                    if (!mounted) return;
                    const extra = payload?.extraStepRequired;
                    if (extra && typeof extra.pieceId === "number") {
                        const pid = extra.pieceId as number;
                        // Only the owner of the piece should auto-select and see the forced Unstable step
                        let pieceColor: "white" | "black" | null = null;
                        if (board) {
                            outerM: for (let y = 0; y < 8; y++) {
                                for (let x = 0; x < 8; x++) {
                                    const c = board[y]?.[x];
                                    if (c && c.id === pid) { pieceColor = (c.color as any) ?? null; break outerM; }
                                }
                            }
                        }
                        if (pieceColor && myColor && pieceColor === myColor) {
                            setPostAbilitySelectId(pid);
                            setUnstableLocal(prev => (prev.includes(pid) ? prev : [...prev, pid]));
                        } else {
                            // Ensure opponent doesn't see stale highlights
                            setSelected(null);
                            setHints([]);
                            setAbilityTargets([]);
                        }
                    }
                };
                s.on("ability:applied", onAbility);
                s.on("move:applied", onMoveApplied);
            } catch { /* ignore */ }
        })();
        return () => {
            (async () => {
                try {
                    const s = await getSocket();
                    s.off("ability:applied");
                    s.off("move:applied");
                } catch { }
            })();
            mounted = false;
        };
    }, [board, myColor]);

    // Clear local Unstable flags when the turn color flips (i.e., after completing the forced step)
    const prevTurnRef = useRef<string | null>(null);
    useEffect(() => {
        const cur = currentTurnColor ?? null;
        if (prevTurnRef.current != null && cur !== prevTurnRef.current) {
            setUnstableLocal([]);
            setMimicLocal({}); // clear local Mimicry overrides on turn swap
        }
        prevTurnRef.current = cur;
    }, [currentTurnColor]);

    // After board updates, if we have a postAbilitySelectId, select that piece and compute new hints
    useEffect(() => {
        if (!board || postAbilitySelectId == null) return;
        let fx: number | null = null, fy: number | null = null, piece: BoardCell | null = null;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const c = board[y]?.[x];
                if (c && c.id === postAbilitySelectId) { fx = x; fy = y; piece = c; break; }
            }
            if (fx != null) break;
        }
        if (fx != null && fy != null && piece) {
            setSelected({ x: fx, y: fy, pieceId: piece.id });
            setHints(computeHints({ x: fx, y: fy, pieceId: piece.id }));
        }
        setPostAbilitySelectId(null);
    }, [board, postAbilitySelectId, computeHints]);

    // Compute target highlights while an ability is armed
    useEffect(() => {
        if (!abilityArm || !abilityArm.needsTarget || !board) { setAbilityTargets([]); return; }
        // Find piece position
        let fx: number | null = null, fy: number | null = null, piece: BoardCell | null = null;
        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                const c = board[y]?.[x];
                if (c && c.id === abilityArm.pieceId) { fx = x; fy = y; piece = c; break; }
            }
            if (fx != null) break;
        }
        if (fx == null || fy == null || !piece) { setAbilityTargets([]); return; }
        const color = piece.color as "white" | "black";

        const inside = (x: number, y: number) => x >= 0 && x < 8 && y >= 0 && y < 8;
        const at = (x: number, y: number) => (inside(x, y) ? board[y]?.[x] ?? null : null);
        const targets: Array<{ x: number; y: number }> = [];

    if (abilityArm.pieceType === "PHANTOM_MATRIARCH" && abilityArm.abilityName === "Ethereal Passage") {
            const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
            for (const [dx, dy] of dirs) {
                for (let s = 1; s < 8; s++) {
                    const x = fx + dx * s, y = fy + dy * s;
                    if (!inside(x, y)) break;
                    const c = at(x, y);
                    if (c == null) targets.push({ x, y });
                    // Unlike normal rays, we do NOT break on blockers; we can pass through but cannot land on occupied
                }
            }
        } else if (abilityArm.pieceType === "PHOBIC_LEAPER" && abilityArm.abilityName === "Terror Leap") {
            const ds = [[3, 2], [2, 3], [-3, 2], [-2, 3], [3, -2], [2, -3], [-3, -2], [-2, -3]];
            for (const [dx, dy] of ds) {
                const x = fx + dx, y = fy + dy;
                if (!inside(x, y)) continue;
                const c = at(x, y);
                if (c == null || c.color !== color) targets.push({ x, y });
            }
        } else if (abilityArm.pieceType === "DOPPELGANGER" && abilityArm.abilityName === "Mimicry") {
            // Adjacent non-king pieces (ally or enemy)
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const x = fx + dx, y = fy + dy;
                    if (!inside(x, y)) continue;
                    const c = at(x, y);
                    if (c && (c as any).type !== "SLEEPLESS_EYE") targets.push({ x, y });
                }
            }
        } else if (abilityArm.pieceType === "PSYCHIC_LARVA" && abilityArm.abilityName === "Whispering Swarm") {
            // Only empty horizontal-adjacent squares
            const candidates: Array<[number, number]> = [[fx - 1, fy], [fx + 1, fy]];
            for (const [x, y] of candidates) {
                if (!inside(x, y)) continue;
                const c = at(x, y);
                if (c == null) targets.push({ x, y });
            }
        } else if (abilityArm.pieceType === "SHADOW_HUNTER" && abilityArm.abilityName === "Shadow swap") {
            // Rook-like rays; can land on empty squares and also on allied pieces (to swap). Enemies along path or at dest block.
            const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
            for (const [dx, dy] of dirs) {
                let x = fx + dx, y = fy + dy;
                while (inside(x, y)) {
                    const c = at(x, y);
                    if (c == null) {
                        targets.push({ x, y });
                    } else {
                        if (c.color === color) {
                            // Ally at destination: can target to swap, but cannot go past
                            targets.push({ x, y });
                        }
                        // Enemy blocks; stop in both cases after encountering any piece
                        break;
                    }
                    x += dx; y += dy;
                }
            }
        } else {
            // Default: no custom targets
        }

        setAbilityTargets(targets);
    }, [abilityArm, board]);

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
                    {board ? (
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
                                                    data-x={actualColIdx}
                                                    data-y={actualRowIdx}
                                                    onClick={() => {
                                                        // Ability arming: next click selects target square, consume event
                                                        if (abilityArm) {
                                                            if (abilityArm.needsTarget) {
                                                                // Only send if the clicked square is one of the highlighted ability targets
                                                                const isTarget = abilityTargets.some(t => t.x === actualColIdx && t.y === actualRowIdx);
                                                                if (!isTarget) return;
                                                                sendAbility(abilityArm.pieceId, abilityArm.abilityName, { x: actualColIdx, y: actualRowIdx });
                                                            } else {
                                                                sendAbility(abilityArm.pieceId, abilityArm.abilityName);
                                                            }
                                                            return;
                                                        }
                                                        // Removed: opening abilities on click (so moves aren’t blocked)
                                                        if (finished) return;
                                                        if (pendingMove) return;
                                                        if (!myColor) return;

                                                        if (cell && cell.color && isMine) {
                                                            // Clicking the same selected square cancels selection
                                                            if (selected && selected.x === actualColIdx && selected.y === actualRowIdx) {
                                                                setSelected(null);
                                                                setHints([]);
                                                                return;
                                                            }
                                                            setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                                            // Always show paths on selection so users can see new paths after abilities
                                                            setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
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
                                                        // Cancel if dropped onto the original square
                                                        if (selected.x === actualColIdx && selected.y === actualRowIdx) {
                                                            setSelected(null);
                                                            setHints([]);
                                                            return;
                                                        }
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
                                                                // If an ability was armed, cancel it so dragging works seamlessly
                                                                if (abilityArm) setAbilityArm(null);
                                                                setSelected({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id });
                                                                // Show paths even if not our turn (attemptMove will still guard turn)
                                                                setHints(computeHints({ x: actualColIdx, y: actualRowIdx, pieceId: cell.id }));
                                                            }}
                                                            onOpenAbilities={() => openAbilities(cell)}
                                                        />
                                                    )}

                                                    {/* Ability button for the selected piece (tap to open) */}
                                                    {isSelected && cell && (
                                                        <button
                                                            className="absolute top-1 right-1 size-1.5 md:size-6 rounded-md bg-black/60 text-fuchsia-200 ring-1 ring-neutral-800 hover:bg-black/80"
                                                            onClick={(e) => { e.stopPropagation(); openAbilities(cell); }}
                                                            aria-label="Show abilities"
                                                            title="Show abilities"
                                                        >
                                                            ☽
                                                        </button>
                                                    )}

                                                    {/* Move hint dot (hidden while a move is pending or when an ability is armed) */}
                                                    {!pendingMove && !abilityArm && hints.some(h => h.x === actualColIdx && h.y === actualRowIdx) && (
                                                        <span className="absolute w-3 h-3 rounded-full bg-foreground" style={{ pointerEvents: "none" }}></span>
                                                    )}

                                                    {/* Ability target highlight while arming (use dot style like move hints) */}
                                                    {abilityArm && abilityArm.needsTarget && abilityTargets.some(t => t.x === actualColIdx && t.y === actualRowIdx) && (
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
                    ) : (
                        <div className="flex justify-center items-center h-full">
                            <div className="space-y-3 text-center">
                                <div className="mx-auto w-8 h-8 border-2 border-gray-700 border-t-indigo-500 rounded-full animate-spin"></div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Ability arming banner */}
                {abilityArm && (
                    <div className="mt-3 text-sm px-3 py-2 rounded-lg bg-fuchsia-900/20 text-fuchsia-100 ring-1 ring-fuchsia-800/40 flex items-center justify-between gap-3 w-full max-w-xl">
                        <div className="flex items-center gap-2">
                            <span className="inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-400 animate-pulse" />
                            {abilityArm.needsTarget ? (
                                <span>Select a target square for {abilityArm.abilityName}</span>
                            ) : (
                                <span>Using {abilityArm.abilityName}…</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {abilityBusy && (<span className="inline-block h-4 w-4 border-2 border-fuchsia-500 border-t-transparent rounded-full animate-spin" />)}
                            <button
                                className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 ring-1 ring-neutral-700"
                                onClick={() => setAbilityArm(null)}
                                disabled={abilityBusy}
                            >Cancel</button>
                        </div>
                    </div>
                )}
                {lastError && (
                    <div className="mt-2 text-center text-xs text-red-400">{lastError}</div>
                )}
            </div>

            <PieceAbilities
                piece={abilityPiece as any}
                onClose={() => setAbilityPiece(null)}
                canUse={(() => {
                    if (!abilityPiece || !myColor || finished) return false;
                    if (currentTurnColor !== myColor) return false;
                    return abilityPiece.color === myColor;
                })()}
                onUseActive={(abilityName) => {
                    if (!abilityPiece || !myColor || finished) return;
                    if (currentTurnColor !== myColor) return; // not your turn
                    if (abilityPiece.color !== myColor) return; // not your piece
                    if (!abilityPiece) return;
                    const pieceType = abilityPiece.type as string;
                    const key = `${pieceType}:${abilityName}`;
                    const targeted = new Set<string>([
                        "SLEEPLESS_EYE:Terrifying Gaze",
                        "DOPPELGANGER:Mimicry",
                        "SHADOW_HUNTER:Shadow swap",
                        "PHOBIC_LEAPER:Terror Leap",
                        "PHANTOM_MATRIARCH:Ethereal Passage",
                        "PSYCHIC_LARVA:Whispering Swarm",
                    ]);
                    const needsTarget = targeted.has(key);
                    setAbilityPiece(null);
                    if (needsTarget) {
                        // Enter arming mode; next square click will send
                        setHints([]); // clear old path; show only ability targets
                        setAbilityArm({ pieceId: abilityPiece.id, pieceType, abilityName, needsTarget: true });
                    } else {
                        // Fire immediately
                        setAbilityArm({ pieceId: abilityPiece.id, pieceType, abilityName, needsTarget: false });
                        // For instantaneous abilities like Terror Leap, clear current selection/hints immediately
                        setSelected(null);
                        setHints([]);
                        sendAbility(abilityPiece.id, abilityName);
                    }
                }}
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