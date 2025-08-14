"use client";

import { useParams } from "next/navigation";
import Board from "@/components/Board";
import Clocks from "@/components/Clocks";
import { useMatch } from "@/contexts/MatchContext";
import { useMatchHydration } from "@/hooks/useMatchHydration";

export default function MatchPage() {
  const { id } = useParams<{ id: string }>();
  const { board } = useMatch();

  useMatchHydration(Number(id));

  return (
    <main className="min-h-dvh bg-gray-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl">
        <Board board={board} />
        <Clocks />

        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Living Nightmare Chess</p>
        </div>
      </div>
    </main>
  );
}