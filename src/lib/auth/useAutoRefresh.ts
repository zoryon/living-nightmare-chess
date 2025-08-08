"use client";

import { useEffect, useRef } from "react";

import { ensureFreshToken } from "@/lib/auth/refresh-client";

export function useAutoRefresh(intervalSeconds = 480) { // 8 minutes default
    const started = useRef(false);
    useEffect(() => {
        if (started.current) return;
        started.current = true;
        let cancelled = false;
        async function loop() {
            while (!cancelled) {
                await new Promise(r => setTimeout(r, intervalSeconds * 1000));
                await ensureFreshToken();
            }
        }
        loop();
        return () => { cancelled = true; };
    }, [intervalSeconds]);
}
