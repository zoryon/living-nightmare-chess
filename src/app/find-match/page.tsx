"use client";

import { useMatchmaking } from "@/hooks/useMatchmaking";
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
          <Button size="lg" onClick={findMatch} disabled={state.status === "searching"} className="cursor-pointer">
            {state.status === "searching" ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Searching…
              </span>
            ) : (
              "Find Match"
            )}
          </Button>
        </div>

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
