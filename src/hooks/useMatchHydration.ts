"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";

import { getSocket } from "@/lib/socket";
import { useMatch } from "@/contexts/MatchContext";
import { setupMatch } from "@/lib/match/setup";
import type { GameState } from "@/types";

/**
 * Hydrates the match context when landing directly on /match/[id] or on refresh.
 * Connects to the WS server, requests current state, and listens for updates.
 */
export function useMatchHydration(matchId: number) {
    const { setBoard, setGameId, setMyUserId, setMyColor, setCurrentTurnColor, setWhiteMs, setBlackMs, setClocksSyncedAt, setFinished, setWinnerId, setFinishReason, setHydrated } = useMatch();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
    // Reset hydration flag on entry
    setHydrated(false);
        let mounted = true;

        (async () => {
            try {
                const s = await getSocket();
                if (!mounted) return;
                socketRef.current = s;

                const applyIfThisMatch = (game: GameState | null | undefined) => {
                    if (game && typeof game.id === "number" && game.id === matchId) {
                        setupMatch({ setBoard, setGameId, game });
                        // Fetch current user id and set my color
                        fetch("/api/me", { method: "GET", credentials: "include" })
                            .then(r => r.json())
                            .then((data) => {
                                const uid: number | undefined = data?.publicUser?.id;
                                if (typeof uid === "number") {
                                    setMyUserId(uid);
                                    const mp = game.match_player?.find(p => p.userId === uid);
                                    if (mp) setMyColor(mp.color === "WHITE" ? "white" : "black");
                                }
                            })
                            .catch(() => { /* ignore */ });
                    }
                };

                // On resume (server emits on connect if user has an ongoing match)
                const onResume = (game: GameState) => applyIfThisMatch(game);
                s.on("match:resume", onResume);

                // On full state update (emitted by game handler)
                const onUpdate = (payload: any) => {
                    applyIfThisMatch(payload?.match as GameState);
                    const m = payload?.match;
                    if (m && typeof m.turn === "number") {
                        setCurrentTurnColor(m.turn % 2 === 1 ? "white" : "black");
                    }
                    if (payload?.clocks && typeof payload.clocks.whiteMs === "number" && typeof payload.clocks.blackMs === "number") {
                        setWhiteMs(payload.clocks.whiteMs);
                        setBlackMs(payload.clocks.blackMs);
                        setClocksSyncedAt(Date.now());
                    }
                    // If we get an update for this match, consider hydrated
                    setHydrated(true);
                };
                s.on("match:update", onUpdate);
                s.on("match:finished", (payload: { matchId?: number; winnerId: number | null; reason: string }) => {
                    if (typeof payload?.matchId === "number" && payload.matchId !== matchId) return;
                    setFinished(true);
                    setWinnerId(payload?.winnerId ?? null);
                    setFinishReason(payload?.reason ?? null);
                });

                // Immediately request current state from the game handler
                // (handler is auto-deployed for user's ongoing match on connect)
        s.emit("match:state:request", {}, (res: any) => {
                    if (res?.ok) {
                        applyIfThisMatch(res.match as GameState);
                        const m = res.match as GameState;
                        if (m && typeof (m as any).turn === "number") {
                            setCurrentTurnColor((m as any).turn % 2 === 1 ? "white" : "black");
                        }
                        if (res?.clocks && typeof res.clocks.whiteMs === "number" && typeof res.clocks.blackMs === "number") {
                            setWhiteMs(res.clocks.whiteMs);
                            setBlackMs(res.clocks.blackMs);
                            setClocksSyncedAt(Date.now());
                        }
                        if ((m as any)?.status === "FINISHED") {
                            setFinished(true);
                            setWinnerId((m as any)?.winnerId ?? null);
                            setFinishReason("finished");
                        } else {
                            setFinished(false);
                            setWinnerId(null);
                            setFinishReason(null);
                        }
            setHydrated(true);
                    }
                });
            } catch (e) {
                // noop – page can keep showing placeholder
                console.warn("match hydration failed", e);
            }
        })();

        return () => {
            mounted = false;
            const s = socketRef.current;
            if (s) {
                s.off("match:resume");
                s.off("match:update");
                s.off("match:finished");
            }
        };
    }, [matchId, setBoard, setGameId, setMyUserId, setMyColor, setCurrentTurnColor, setWhiteMs, setBlackMs, setClocksSyncedAt, setFinished, setWinnerId, setFinishReason]);
}
