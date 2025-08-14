"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";

import { GameState, MatchState } from "@/types";
import { getSocket } from "@/lib/socket";
import { useMatch } from "@/contexts/MatchContext";
import { setupMatch } from "@/lib/match/setup";

export function useMatchmaking() {
  const [state, setState] = useState<MatchState>({ status: "idle" });
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

  const { setBoard, setGameId, setMyUserId, setMyColor, setCurrentTurnColor, setWhiteMs, setBlackMs, setClocksSyncedAt } = useMatch();
  // Prevent double navigations if multiple events arrive (start/update/resume)
  const navigatedRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const s = await getSocket();
      if (!mounted) return;
      socketRef.current = s;

      s.on("connect_error", (err) => {
        setState({ status: "error", message: err.message });
      });

      s.on("match:searching", () => {
        setState({ status: "searching" });
      });

  s.on("match:start", (game: GameState) => {
        if (!game) return console.log("Error: no game data");
        setState({ status: "starting", gameId: game.id });

        // Create board
        setupMatch({ setBoard, setGameId, game});
  if (typeof (game as any).turn === "number") setCurrentTurnColor((game as any).turn % 2 === 1 ? "white" : "black");
  // If server attached clocks on start via a preceding match:update, they will be set by hydration; as a fallback, we can request state after navigating.
        fetch("/api/me", { method: "GET", credentials: "include" })
          .then(r => r.json())
          .then((data) => {
            const uid: number | undefined = data?.publicUser?.id;
            if (typeof uid === "number") {
              setMyUserId(uid);
              const mp = game.match_player?.find(p => p.userId === uid);
              if (mp) setMyColor(mp.color === "WHITE" ? "white" : "black");
            }
          }).catch(() => {});
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          router.push(`/match/${game.id}`);
        }
      });

  s.on("match:resume", (game: GameState) => {
        if (!game) return;
        setState({ status: "resumed", gameId: game.id });

        // Create board
        setupMatch({ setBoard, setGameId, game });
  if (typeof (game as any).turn === "number") setCurrentTurnColor((game as any).turn % 2 === 1 ? "white" : "black");
        fetch("/api/me", { method: "GET", credentials: "include" })
          .then(r => r.json())
          .then((data) => {
            const uid: number | undefined = data?.publicUser?.id;
            if (typeof uid === "number") {
              setMyUserId(uid);
              const mp = game.match_player?.find(p => p.userId === uid);
              if (mp) setMyColor(mp.color === "WHITE" ? "white" : "black");
            }
          }).catch(() => {});
        if (!navigatedRef.current) {
          navigatedRef.current = true;
          router.replace(`/match/${game.id}`);
        }
      });

      // Also react to later updates while on this page
      s.on("match:update", (payload: any) => {
        const m = payload?.match;
        if (!m) return;
        if (typeof m.turn === "number") setCurrentTurnColor(m.turn % 2 === 1 ? "white" : "black");
        if (payload?.clocks && typeof payload.clocks.whiteMs === "number" && typeof payload.clocks.blackMs === "number") {
          setWhiteMs(payload.clocks.whiteMs);
          setBlackMs(payload.clocks.blackMs);
          setClocksSyncedAt(Date.now());
        }
        // Fallback: if we missed match:start, navigate on first full-state update
        if (!navigatedRef.current && typeof m.id === "number") {
          navigatedRef.current = true;
          router.replace(`/match/${m.id}`);
        }
      });

      s.on("error:match_not_found", () => {
        setState({ status: "error", message: "No match found" });
      });
    })();

    return () => {
      mounted = false;
      const s = socketRef.current;
      if (s) {
        s.off("connect_error");
        s.off("match:searching");
        s.off("match:start");
        s.off("match:resume");
  s.off("error:match_not_found");
        s.off("error:opponent_disconnected");
  s.off("match:update");
      }
    };
  }, [router]);

  const findMatch = useCallback(async () => {
    try {
      const s = await getSocket();
      if (!s.connected) await new Promise<void>((res, rej) => {
        s.once("connect", () => res());
        s.once("connect_error", rej);
      });
      // Explicitly ask server to queue
      s.emit("match:queue");
      setState({ status: "searching" });
    } catch (e: any) {
      setState({ status: "error", message: e?.message || "Connection failed" });
    }
  }, []);

  return { state, findMatch };
}
