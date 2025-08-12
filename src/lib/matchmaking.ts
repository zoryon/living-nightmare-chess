"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Socket } from "socket.io-client";

import { getSocket } from "@/lib/socket";

export type MatchState =
  | { status: "idle" }
  | { status: "searching" }
  | { status: "starting"; gameId: number }
  | { status: "resumed"; gameId: number }
  | { status: "error"; message: string };

export function useMatchmaking() {
  const [state, setState] = useState<MatchState>({ status: "idle" });
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();

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

      s.on("match:start", (game) => {
        setState({ status: "starting", gameId: game.id });
        router.push(`/match/${game.id}`);
      });

      s.on("match:resume", (game) => {
        setState({ status: "resumed", gameId: game.id });
        router.replace(`/match/${game.id}`);
      });

      s.on("error:match_not_found", () => {
        setState({ status: "error", message: "No match found" });
      });

      s.on("error:opponent_disconnected", () => {
        setState({ status: "error", message: "Opponent disconnected. Please retry." });
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
