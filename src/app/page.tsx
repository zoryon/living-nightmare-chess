"use client";

import { useEffect, useRef, useState } from "react";

import { useMatchmaking } from "@/hooks/useMatchmaking";
import { secureFetch } from "@/lib/auth/refresh-client";
import { useMatch } from "@/contexts/MatchContext";
import Rules from "@/components/dialogs/Rules";
import Tips from "@/components/dialogs/Tips";
import PiecesGallery from "@/components/PiecesGallery";
import PlayCard from "@/components/home/PlayCard";
import QuickActions from "@/components/home/QuickActions";

const HomePage = () => {
  const match = useMatch();

  const [queuePlayersNum, setQueuePlayersNum] = useState<number>(0);
  const [howToOpen, setHowToOpen] = useState<boolean>(false);
  const [tipsOpen, setTipsOpen] = useState<boolean>(false);
  const prevStatusRef = useRef<string | null>(null);

  const { state, findMatch, cancel, blockedByInvite } = useMatchmaking();

  // Queue polling (token-aware)
  async function fetchQueue() {
    try {
      const res = await secureFetch("/api/queues/match/summary", { method: "GET" });
      if (!res.ok) return;
      const data = await res.json();
      setQueuePlayersNum(typeof data?.playersNum === "number" ? data.playersNum : 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(() => { fetchQueue(); }, 120_000); // 2 min
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (state.status === "searching") fetchQueue();
  }, [state.status]);

  useEffect(() => {
    const prev = prevStatusRef.current;
    if (prev === "searching" && state.status === "idle") fetchQueue();
    prevStatusRef.current = state.status;
  }, [state.status]);

  return (
    <div className="relative min-h-dvh flex flex-col">
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-6 py-10 sm:py-12">
          {/* Content grid: left = Play card, right = Quick actions */}
          <div className="grid gap-6 lg:grid-cols-3 mt-4">
            {/* Play/Join card (prominent) */}
            <div className="lg:col-span-2">
              <PlayCard
                status={state.status}
                message={("message" in state ? state.message : undefined)}
                queuePlayersNum={queuePlayersNum}
                onFindMatch={findMatch}
                onCancelSearch={() => { cancel(); setTimeout(() => { fetchQueue(); }, 250); }}
                disableFindMatch={Boolean(match.gameId && !match.finished) || blockedByInvite}
              />
            </div>

            {/* Quick actions & shortcuts */}
            <div className="space-y-6">
              <QuickActions
                onOpenHowTo={() => setHowToOpen(true)}
                onOpenTips={() => setTipsOpen(true)}
              />
            </div>
          </div>
        </section>

        {/* Gallery of custom pieces */}
        <section className="max-w-6xl mx-auto px-6 pb-10">
          <PiecesGallery />
        </section>
      </main>
      <Rules open={howToOpen} onClose={() => setHowToOpen(false)} />
      <Tips open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
};

export default HomePage;