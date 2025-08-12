"use client";

import { useEffect, useRef } from "react";

import { ensureFreshToken } from "@/lib/auth/refresh-client";

export function useAutoRefresh(intervalSeconds = 110) { // ~2 minutes default, a bit earlier than 120s
    const started = useRef(false);
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        let cancelled = false;
        async function loop() {
            while (!cancelled) {
                // Add small random jitter (0-10s) to avoid simultaneous refreshes
                const jitterMs = Math.floor(Math.random() * 10000);
                await new Promise(r => setTimeout(r, intervalSeconds * 1000 + jitterMs));
                await ensureFreshToken();
            }
        }
        loop();
        return () => { cancelled = true; };
    }, [intervalSeconds]);
}
