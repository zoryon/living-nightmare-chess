"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import { PIECES, PIECE_IMAGES } from "@/constants";
import PieceAbilities from "@/components/PieceAbilities";

type GalleryItem = {
  key: string;
  name: string;
  imgWhite: string;
  imgBlack: string;
  slug: string;
  movement: string;
};

export default function PiecesGallery() {
  const items = useMemo<GalleryItem[]>(() => {
    const res: GalleryItem[] = [];
    for (const key of Object.keys(PIECES)) {
      const p = PIECES[key];
      const imgWhite = (PIECE_IMAGES as any)[key]?.white || "";
      const imgBlack = (PIECE_IMAGES as any)[key]?.black || "";
      const slug = p.name.toLowerCase().replace(/\s+/g, "-");
      res.push({ key, name: p.name, imgWhite, imgBlack, slug, movement: p.defaultMovement });
    }
    return res;
  }, []);

  const movements = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) set.add(it.movement);
    return ["all", ...Array.from(set)];
  }, [items]);

  const [query, setQuery] = useState("");
  const [movement, setMovement] = useState<string>("all");
  const [previewColor, setPreviewColor] = useState<"white" | "black">("white");
  const [openKey, setOpenKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const okQ = !q || i.name.toLowerCase().includes(q) || i.slug.includes(q) || i.key.toLowerCase().includes(q);
      const okM = movement === "all" || i.movement === movement;
      return okQ && okM;
    });
  }, [items, query, movement]);

  const openPiece = items.find((i) => i.key === openKey) || null;

  return (
    <section id="pieces" className="mt-10">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold tracking-tight">Explore pieces</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pieces…"
              className="h-9 w-56 rounded-md border bg-background px-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>
          <select
            value={movement}
            onChange={(e) => setMovement(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Filter by movement"
          >
            {movements.map((m) => (
              <option key={m} value={m}>{m === "all" ? "All movements" : m}</option>
            ))}
          </select>
          <button
            onClick={() => setPreviewColor((c) => (c === "white" ? "black" : "white"))}
            className="w-32 h-9 rounded-md border bg-background px-3 text-sm hover:bg-muted"
            aria-label="Toggle preview color"
          >
            Preview: <span className="ml-1 font-medium capitalize">{previewColor}</span>
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filtered.map((it) => {
          const img = previewColor === "white" ? it.imgWhite : it.imgBlack;
          return (
            <button
              key={it.key}
              onClick={() => setOpenKey(it.key)}
              className="group relative overflow-hidden rounded-xl border bg-card/60 p-3 text-left shadow-sm transition-colors hover:bg-card"
            >
              <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-2xl transition-opacity group-hover:opacity-80" />
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 shrink-0 rounded-md ring-1 ring-border/60 bg-muted/40">
                  {img ? (
                    <Image src={img} alt={it.name} fill sizes="56px" className="object-contain p-1" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-muted-foreground">?</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{it.name}</p>
                  <p className="text-xs text-muted-foreground">{it.movement}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {openPiece && (
        <PieceAbilities
          piece={{ id: -1 as any, name: openPiece.name, slug: openPiece.slug, type: openPiece.key, color: previewColor }}
          onClose={() => setOpenKey(null)}
        />
      )}
    </section>
  );
}
