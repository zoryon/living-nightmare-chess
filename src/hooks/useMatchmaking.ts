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

  const { setBoard, setGameId } = useMatch();

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

        setupMatch({ setBoard, setGameId, game});

        router.push(`/match/${game.id}`);
      });

      s.on("match:resume", (game) => {
        setState({ status: "resumed", gameId: game.id });
        router.replace(`/match/${game.id}`);
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
      }
    };
  }, [router]);

  const findMatch = useCallback(async () => {
    // Simply connecting triggers queueing on the server.
    try {
      const s = await getSocket();
      if (!s.connected) await new Promise<void>((res, rej) => {
        s.once("connect", () => res());
        s.once("connect_error", rej);
      });
      setState({ status: "searching" });
    } catch (e: any) {
      setState({ status: "error", message: e?.message || "Connection failed" });
    }
  }, []);

  return { state, findMatch };
}
