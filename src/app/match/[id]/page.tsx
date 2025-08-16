"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Board from "@/components/Board";
import Clocks from "@/components/Clocks";
import { useMatch } from "@/contexts/MatchContext";
import { useMatchHydration } from "@/hooks/useMatchHydration";
import { getSocket } from "@/lib/socket";
import PromotionModal from "@/components/PromotionModal";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { board, myUserId, myColor, finished, winnerId, finishReason, hydrated, setFinished, setWinnerId, setFinishReason, setHydrated } = useMatch();
  const [promotionLarvaId, setPromotionLarvaId] = useState<number | null>(null);

  useMatchHydration(Number(id));

  // Clear any stale end-of-match state synchronously on page entry for this id
  useLayoutEffect(() => {
    setHydrated(false);
    setFinished(false);
    setWinnerId(null);
    setFinishReason(null);
  }, [id, setHydrated, setFinished, setWinnerId, setFinishReason]);

  // Listen for server prompting a promotion (after a Larva reaches last rank)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getSocket();
        const onMoveApplied = (payload: any) => {
          if (!mounted) return;
          const pr = payload?.promotionRequired as { pieceId: number } | undefined;
          if (pr && typeof pr.pieceId === "number") {
            // Only open for the owner of the larva
            const pid = pr.pieceId;
            const ownerId = (() => {
              if (!board) return null;
              for (let y = 0; y < 8; y++) {
                for (let x = 0; x < 8; x++) {
                  const c = board[y]?.[x];
                  if (c && c.id === pid) return c.playerId ?? null;
                }
              }
              return null;
            })();
            if (ownerId != null && ownerId === myUserId) setPromotionLarvaId(pid);
          }
        };
        const onPromotionApplied = (_payload: any) => {
          if (!mounted) return;
          // Close modal if promotion finished from any side
          setPromotionLarvaId(null);
        };
        s.on("move:applied", onMoveApplied);
        s.on("promotion:applied", onPromotionApplied);
      } catch { }
    })();
    return () => {
      mounted = false;
      (async () => {
        try {
          const s = await getSocket();
          s.off("move:applied");
          s.off("promotion:applied");
        } catch { }
      })();
    };
  }, [board, myUserId]);

  // Also detect promotion required from hydrated board state (e.g., after reload)
  useEffect(() => {
    if (!board || !myUserId) return;
    // Find any Larva with status.promotionPending belonging to me
    let found: number | null = null;
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const c = board[y]?.[x];
        if (!c) continue;
        if (c.playerId !== myUserId) continue;
        if (c.type !== "PSYCHIC_LARVA") continue;
        const st = (c.status as any) || {};
        if (st.promotionPending) {
          found = c.id; break;
        }
      }
      if (found != null) break;
    }
    if (found != null) setPromotionLarvaId(found);
  }, [board, myUserId]);

  return (
    <main className="mx-auto max-w-5xl px-3 py-4 md:py-6">
      <div className="flex items-center justify-between mb-2">
        <button
          className="text-sm px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          disabled={finished}
          onClick={async () => {
            try {
              const s = await getSocket();
              await new Promise<void>((resolve) => {
                s.emit("match:resign", {}, (_ack: any) => resolve());
              });
            } catch { }
          }}
        >
          Resign
        </button>
      </div>

      <div className="relative">
        <Board board={board} />
        {promotionLarvaId != null && (
          <PromotionModal larvaId={promotionLarvaId} onClose={() => setPromotionLarvaId(null)} />
        )}
        {hydrated && finished && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 text-center space-y-3 w-5/6 max-w-sm">
              <h2 className="text-xl font-semibold">Match finished</h2>
              <p className="text-sm text-gray-300">
                {winnerId == null ? "Draw" : winnerId === myUserId ? "You won" : "You lost"}
                {finishReason ? ` · ${finishReason}` : ""}
              </p>
              <div className="flex gap-3 justify-center pt-2">
                <button
                  className="px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => router.push("/find-match")}
                >Play again</button>
                <button
                  className="px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600"
                  onClick={() => router.push("/")}
                >Home</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Clocks />

      <div className="mt-8 text-center text-gray-600 text-sm">
        <p>Living Nightmare Chess</p>
      </div>
    </main>
  );
}