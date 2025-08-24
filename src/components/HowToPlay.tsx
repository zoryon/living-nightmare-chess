"use client";

import { useEffect } from "react";

export default function HowToPlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close" onClick={onClose} />
      <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[92vw] max-w-2xl max-h-[85vh] overflow-y-auto nice-scroll rounded-2xl border bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 text-neutral-100 shadow-2xl ring-1 ring-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">How to play</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800">✕</button>
        </div>
        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            <p className="text-neutral-300">
              Nox Chess uses classic chess rules plus special systems and abilities. Below are the core rules you need to play.
            </p>
            <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
              <h3 className="font-medium mb-1">Board</h3>
              <ul className="list-disc pl-5 text-neutral-300 space-y-1">
                <li>Standard 8x8 chess board.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
              <h3 className="font-medium mb-1">Dream Energy (DE)</h3>
              <ul className="list-disc pl-5 text-neutral-300 space-y-1">
                <li>DE is required to activate a piece's <em>Special Active Ability</em>.</li>
                <li>Gain <strong>+2 DE</strong> when you capture an enemy piece.</li>
                <li>Gain <strong>+8 DE</strong> by choosing to <em>Meditate</em> instead of moving. You cannot meditate while in check.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
              <h3 className="font-medium mb-1">Nightmare Phases</h3>
              <ul className="list-disc pl-5 text-neutral-300 space-y-2">
                <li>
                  <span className="font-medium">Turns 1-4: The Calm Before the Storm</span>
                  <div>Standard chess rules only. No abilities are active yet.</div>
                </li>
                <li>
                  <span className="font-medium">Turns 4-40: Creeping Shadows</span>
                  <div>All pieces gain their passive and active abilities.</div>
                </li>
                <li>
                  <span className="font-medium">Turns 41-60: Unstable Ground</span>
                  <div>At the start of each turn, a random square becomes <em>dangerous</em> for that turn. Any piece ending its move on that square is immobilized on its next turn.</div>
                </li>
                <li>
                  <span className="font-medium">Turn 61+: Total Chaos</span>
                  <div>Each player's Dream Energy is tripled. All active abilities are fully refreshed and can be used again.</div>
                </li>
              </ul>
            </div>
          </section>

          <section className="space-y-2">
            <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
              <h3 className="font-medium mb-1">Corrupted Promotion</h3>
              <p className="text-neutral-300 mb-1">
                When a <strong>Psychic Larva</strong> (pawn) reaches the 8th rank, choose one of the following instead of normal promotion:
              </p>
              <ol className="list-decimal pl-5 text-neutral-300 space-y-1">
                <li><strong>Summon a Nightmare:</strong> Remove the Larva and return a Living Nightmare piece (Matriarch, Hunter, Doppelgänger, or Leaper) to the promotion square.</li>
                <li><strong>Infestation:</strong> Remove the Larva and place <strong>three new Psychic Larvae</strong> on any three empty squares of your starting row.</li>
              </ol>
            </div>
          </section>

          <p className="text-xs text-neutral-400">Standard chess rules apply unless explicitly overridden by these special rules and abilities. Press Esc to close.</p>
        </div>
      </div>
    </div>
  );
}
