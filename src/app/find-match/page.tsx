"use client";

import { useMatchmaking } from "@/hooks/useMatchmaking";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { secureFetch } from "@/lib/auth/refresh-client";

export default function FindMatchPage() {
  const { state, findMatch, cancel } = useMatchmaking();

  const [queuePlayersNum, setQueuePlayersNum] = useState<number>(0);
  const prevStatusRef = useRef<string | null>(null);

  async function fetchQueue() {
    const res = await secureFetch("/api/queues/match/summary", { method: "GET" });
    if (!res.ok) return;

    const data = await res.json();
    setQueuePlayersNum(data.playersNum);
  }

  useEffect(() => {
    fetchQueue();

    const interval = setInterval(() => {
      fetchQueue();
    }, 120_000); // 2 min

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.status === "searching") {
      fetchQueue();
    }
  }, [state.status]);

  // When leaving the queue (searching -> idle), refresh the count
  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === "searching" && state.status === "idle") {
      fetchQueue();
    }
    prevStatusRef.current = state.status;
  }, [state.status]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Find a Match</h1>
        <p className="text-muted-foreground">
          Click the button to enter the queue and get paired with an opponent.
        </p>

        <div className="flex items-center justify-center gap-3">
          {state.status === "searching" ? (
            <>
              <Button size="lg" disabled className="cursor-wait">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  Searching…
                </span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => {
                  cancel();
                  // Optimistically refresh the queue count after cancelling
                  setTimeout(() => { fetchQueue(); }, 250);
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={findMatch} className="cursor-pointer">Find Match</Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          <span className="text-green-500">{queuePlayersNum}</span>
          {" "}players currently in queue
        </p>
        <Status state={state.status} />
        {state.status === "error" && state.message && (
          <p className="text-sm text-red-500" role="alert">{state.message}</p>
        )}
      </div>
    </main>
  );
}

function Status({ state }: { state: string }) {
  if (state === "idle") return <p className="text-sm text-muted-foreground">Idle</p>;
  if (state === "searching") return <p className="text-sm">Looking for an opponent… Stay on this page.</p>;
  if (state === "starting") return <p className="text-sm">Starting game…</p>;
  if (state === "resumed") return <p className="text-sm">Resumed existing match.</p>;
  return null;
}
