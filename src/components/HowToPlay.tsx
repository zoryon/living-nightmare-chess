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
      <div className="absolute left-1/2 top-8 -translate-x-1/2 w-[92vw] max-w-2xl rounded-2xl border bg-gradient-to-b from-neutral-900 via-neutral-950 to-black p-5 text-neutral-100 shadow-2xl ring-1 ring-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">How to play</h2>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-neutral-900 ring-1 ring-neutral-800 hover:bg-neutral-800">✕</button>
        </div>
        <div className="space-y-4 text-sm">
          <p>
            Nox Chess is a fast variant of chess with six custom pieces and Dream Energy (DE) used to power abilities.
            Turns alternate between Calm (no abilities) and Nightfall (abilities enabled).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-neutral-300">
            <li>Capture the opponent's King-equivalent by checkmating as in chess.</li>
            <li>During Nightfall, pieces with Active abilities may spend DE to use them.</li>
            <li>Some passives always apply; read each piece card for details.</li>
          </ul>
          <div className="rounded-xl border border-neutral-800 bg-black/40 p-3">
            <h3 className="font-medium mb-1">Quick tips</h3>
            <ul className="list-disc pl-5 text-neutral-300 space-y-1">
              <li>Mouse over a piece to see its abilities. On mobile, tap the piece.</li>
              <li>Energy refills each of your turns; plan combos around Nightfall.</li>
              <li>Use the Join by ID field to battle a friend instantly.</li>
            </ul>
          </div>
          <p className="text-xs text-neutral-400">Close this dialog to return. Press Esc anytime.</p>
        </div>
      </div>
    </div>
  );
}
