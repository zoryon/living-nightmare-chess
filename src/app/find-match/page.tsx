"use client";

import { useMatchmaking } from "@/lib/matchmaking";
import { Button } from "@/components/ui/button";

export default function FindMatchPage() {
  const { state, findMatch } = useMatchmaking();

  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Find a Match</h1>
        <p className="text-muted-foreground">
          Click the button to enter the queue and get paired with an opponent.
        </p>

        <div>
          <Button size="lg" onClick={findMatch} disabled={state.status === "searching"}>
            {state.status === "searching" ? "Searching…" : "Find Match"}
          </Button>
        </div>

        <Status state={state.status} />
      </div>
    </main>
  );
}

function Status({ state }: { state: string }) {
  if (state === "idle") return <p className="text-sm text-muted-foreground">Idle</p>;
  if (state === "searching") return <p className="text-sm">Looking for an opponent…</p>;
  if (state === "starting") return <p className="text-sm">Starting game…</p>;
  if (state === "resumed") return <p className="text-sm">Resumed existing match.</p>;
  return null;
}
