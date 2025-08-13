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
    const { setBoard, setGameId } = useMatch();
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        let mounted = true;

        (async () => {
            try {
                const s = await getSocket();
                if (!mounted) return;
                socketRef.current = s;

                const applyIfThisMatch = (game: GameState | null | undefined) => {
                    if (game && typeof game.id === "number" && game.id === matchId) {
                        setupMatch({ setBoard, setGameId, game });
                    }
                };

                // On resume (server emits on connect if user has an ongoing match)
                const onResume = (game: GameState) => applyIfThisMatch(game);
                s.on("match:resume", onResume);

                // On full state update (emitted by game handler)
                const onUpdate = (payload: any) => applyIfThisMatch(payload?.match as GameState);
                s.on("match:update", onUpdate);

                // Immediately request current state from the game handler
                // (handler is auto-deployed for user's ongoing match on connect)
                s.emit("match:state:request", {}, (res: any) => {
                    if (res?.ok) applyIfThisMatch(res.match as GameState);
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
            }
        };
    }, [matchId, setBoard, setGameId]);
}
