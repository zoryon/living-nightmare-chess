"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  return (
    <main className="min-h-dvh flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold">Nox Chess</h1>
        <p className="text-muted-foreground">Welcome. Ready to play?</p>
        <Button asChild>
          <Link href="/find-match">Go to Matchmaking page</Link>
        </Button>
      </div>
    </main>
  );
}

export default HomePage;