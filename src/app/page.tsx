"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useMatchmaking } from "@/hooks/useMatchmaking";
import { secureFetch } from "@/lib/auth/refresh-client";
import HowToPlay from "@/components/HowToPlay";
import Tips from "@/components/Tips";
import PiecesGallery from "@/components/PiecesGallery";
import PlayCard from "@/components/home/PlayCard";
import QuickActions from "@/components/home/QuickActions";

const HomePage = () => {
  const router = useRouter();

  const [matchId, setMatchId] = useState<string>("");
  const [continueId, setContinueId] = useState<string | null>(null);
  const [queuePlayersNum, setQueuePlayersNum] = useState<number>(0);
  const [howToOpen, setHowToOpen] = useState<boolean>(false);
  const [tipsOpen, setTipsOpen] = useState<boolean>(false);
  const prevStatusRef = useRef<string | null>(null);

  const { state, findMatch, cancel } = useMatchmaking();

  useEffect(() => {
    // Try common keys to continue a match if the app set one previously
    const keys = ["lastMatchId", "activeMatchId", "currentMatchId", "nox:lastMatchId"];
    for (const k of keys) {
      const v = typeof window !== "undefined" ? localStorage.getItem(k) : null;
      if (v) {
        setContinueId(v);
        break;
      }
    }
  }, []);

  // Queue polling (token-aware)
  async function fetchQueue() {
    try {
      const res = await secureFetch("/api/queue/current", { method: "GET" });
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

  const handleJoin = (e?: FormEvent) => {
    e?.preventDefault();
    if (matchId.trim().length === 0) return;
    router.push(`/match/${encodeURIComponent(matchId.trim())}`);
  };

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
                matchId={matchId}
                setMatchId={setMatchId}
                onFindMatch={findMatch}
                onCancelSearch={() => { cancel(); setTimeout(() => { fetchQueue(); }, 250); }}
                onJoinById={handleJoin}
              />
            </div>

            {/* Quick actions & shortcuts */}
            <div className="space-y-6">
              <QuickActions
                continueId={continueId}
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
      <HowToPlay open={howToOpen} onClose={() => setHowToOpen(false)} />
      <Tips open={tipsOpen} onClose={() => setTipsOpen(false)} />
    </div>
  );
};

export default HomePage;