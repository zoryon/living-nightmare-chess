"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

type Challenge = { id: number; fromUserId: number; toUserId: number };

type ChallengesState = {
    // Keyed by toUserId (who you challenged)
    outgoing: Record<number, number>; // friendId -> challengeId
    // Keyed by fromUserId (who challenged you)
    incoming: Record<number, number>; // friendId -> challengeId
    // Actions
    challenge: (friendId: number) => Promise<void>;
    cancel: (friendId: number) => Promise<void>;
    accept: (friendId: number) => Promise<void>;
    refetch: () => Promise<void>;
};

const ChallengesContext = createContext<ChallengesState | undefined>(undefined);

export function ChallengesProvider({ children }: { children: React.ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [outgoing, setOutgoing] = useState<Record<number, number>>({});
    const [incoming, setIncoming] = useState<Record<number, number>>({});

    const refetch = async () => {
        try {
            const res = await fetch("/api/users/me/challenges", { credentials: "include", cache: "no-store" });
            if (!res.ok) return;
            const data = await res.json();
            const nextOut: Record<number, number> = {};
            const nextIn: Record<number, number> = {};
            for (const ch of (data?.outgoing ?? []) as Array<Challenge>) nextOut[ch.toUserId] = ch.id;
            for (const ch of (data?.incoming ?? []) as Array<Challenge>) nextIn[ch.fromUserId] = ch.id;
            setOutgoing(nextOut);
            setIncoming(nextIn);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        let mounted = true;
        (async () => {
            const s = await getSocket();
            if (!mounted) return;
            setSocket(s);
            await refetch();

            // Socket updates — single subscription for the whole app
            const onCreated = (ch: Challenge) => {
                if (!ch) return;
                setOutgoing(prev => ({ ...prev, [ch.toUserId]: ch.id }));
            };
            const onWaiting = (p: any) => {
                if (!p) return;
                const { id, toUserId } = p as { id: number; toUserId?: number };
                if (typeof id === "number" && typeof toUserId === "number") {
                    setOutgoing(prev => ({ ...prev, [toUserId]: id }));
                }
            };
            const onIncoming = (ch: Challenge) => {
                if (!ch) return;
                setIncoming(prev => ({ ...prev, [ch.fromUserId]: ch.id }));
            };
            const onCancelled = (p: any) => {
                const id = typeof p?.id === "number" ? p.id : null;
                if (!id) return;
                setOutgoing(prev => {
                    const n = { ...prev };
                    for (const k of Object.keys(n)) if (n[+k] === id) delete n[+k];
                    return n;
                });
                setIncoming(prev => {
                    const n = { ...prev };
                    for (const k of Object.keys(n)) if (n[+k] === id) delete n[+k];
                    return n;
                });
            };
            const onDeclined = onCancelled;
            s.on("challenge:created", onCreated);
            s.on("challenge:waiting", onWaiting);
            s.on("challenge:incoming", onIncoming);
            s.on("challenge:cancelled", onCancelled);
            s.on("challenge:declined", onDeclined);

            // Keep in sync when tab regains focus/visibility
            const onFocus = () => { refetch(); };
            const onVisibility = () => { if (document.visibilityState === "visible") refetch(); };
            window.addEventListener("focus", onFocus);
            document.addEventListener("visibilitychange", onVisibility);

            return () => {
                s.off("challenge:created", onCreated);
                s.off("challenge:waiting", onWaiting);
                s.off("challenge:incoming", onIncoming);
                s.off("challenge:cancelled", onCancelled);
                s.off("challenge:declined", onDeclined);
                window.removeEventListener("focus", onFocus);
                document.removeEventListener("visibilitychange", onVisibility);
            };
        })();
        return () => { mounted = false; };
    }, []);

    const actions = useMemo(() => ({
        challenge: async (friendId: number) => {
            // Optimistically reflect pending invite so Cancel appears immediately
            setOutgoing(prev => (prev[friendId] ? prev : { ...prev, [friendId]: -1 }));
            const s = await getSocket();
            s.emit("challenge:create", friendId);
        },
        cancel: async (friendId: number) => {
            const chId = outgoing[friendId];
            if (!chId) return;
            // Optimistically remove from local state so UI unblocks right away
            setOutgoing(prev => { const n = { ...prev }; delete n[friendId]; return n; });
            const s = await getSocket();
            s.emit("challenge:cancel", chId);
        },
        accept: async (friendId: number) => {
            const chId = incoming[friendId];
            if (!chId) return;
            const s = await getSocket();
            s.emit("challenge:accept", chId);
        },
        refetch,
    }), [outgoing, incoming]);

    const value: ChallengesState = { outgoing, incoming, ...actions } as const;
    return (
        <ChallengesContext.Provider value={value}>
            {children}
        </ChallengesContext.Provider>
    );
}

export function useChallenges() {
    const ctx = useContext(ChallengesContext);
    if (!ctx) throw new Error("useChallenges must be used within ChallengesProvider");
    return ctx;
}
