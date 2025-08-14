"use client";

import { useLayoutEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Board from "@/components/Board";
import Clocks from "@/components/Clocks";
import { useMatch } from "@/contexts/MatchContext";
import { useMatchHydration } from "@/hooks/useMatchHydration";
import { getSocket } from "@/lib/socket";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { board, myUserId, myColor, finished, winnerId, finishReason, hydrated, setFinished, setWinnerId, setFinishReason, setHydrated } = useMatch();

  useMatchHydration(Number(id));

  // Clear any stale end-of-match state synchronously on page entry for this id
  useLayoutEffect(() => {
    setHydrated(false);
    setFinished(false);
    setWinnerId(null);
    setFinishReason(null);
  }, [id, setHydrated, setFinished, setWinnerId, setFinishReason]);

  return (
    <main className="min-h-dvh bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl">
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
              } catch {}
            }}
          >
            Resign
          </button>
        </div>

        <div className="relative">
          <Board board={board} />
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
      </div>
    </main>
  );
}