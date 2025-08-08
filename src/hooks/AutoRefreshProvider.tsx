"use client";

import React, { PropsWithChildren, useEffect } from "react";

import { useAutoRefresh } from "@/lib/auth/useAutoRefresh";
import { getOrCreateDeviceId } from "@/lib/device";

/**
 * AutoRefreshProvider
 * Ensures a stable device_id and starts silent refresh loop.
 */
export default function AutoRefreshProvider({ children }: PropsWithChildren) {
    useEffect(() => {
        try { getOrCreateDeviceId(); } catch { /* ignore */ }
    }, []);
    useAutoRefresh();
    return <>{children}</>;
}
