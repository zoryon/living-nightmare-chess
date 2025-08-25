"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Socket } from "socket.io-client";

import { getSocket } from "@/lib/socket";
import { toast } from "sonner";

export default function SocketEvents() {
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        let s: Socket | null = null;
        let mounted = true;
        (async () => {
            try {
                s = await getSocket();
            } catch {
                return;
            }
            if (!mounted || !s) return;

            // If a match starts anywhere, navigate all tabs to it
            const onStart = (game: any) => {
                if (game && typeof game.id === "number") {
                    router.push(`/match/${game.id}`);
                }
            };
            const onResume = (game: any) => {
                if (game && typeof game.id === "number") {
                    router.replace(`/match/${game.id}`);
                }
            };
            s.on("match:start", onStart);
            s.on("match:resume", onResume);

            // Incoming challenge: show a lightweight toast so user knows
            const onIncoming = (_ch: any) => {
                // Avoid duplicating on Friends page where explicit UI exists
                if (!pathname?.startsWith("/friends")) {
                    toast.info("You received a challenge. Open Friends to accept.", {
                        action: { label: "Open Friends", onClick: () => router.push("/friends") },
                        duration: 6000,
                    });
                }
            };
            s.on("challenge:incoming", onIncoming);

            return () => {
                s?.off("match:start", onStart);
                s?.off("match:resume", onResume);
                s?.off("challenge:incoming", onIncoming);
            };
        })();
        return () => { mounted = false; };
    }, [router, pathname]);

    return null;
}
