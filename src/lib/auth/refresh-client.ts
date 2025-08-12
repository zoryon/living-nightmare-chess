import { getDeviceId, setDeviceId } from "@/lib/device";

let refreshing: Promise<boolean> | null = null;

async function callRefresh(): Promise<boolean> {
    try {
        const deviceId = getDeviceId();
        const headers: Record<string, string> = {};
        if (deviceId) headers["x-device-id"] = String(deviceId);
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers
        });
        if (!res.ok) return false;
        const data = await res.json();
        if (data.deviceId && !deviceId) setDeviceId(Number(data.deviceId));
        return data.ok === true;
    } catch {
        return false;
    }
}

export async function ensureFreshToken(): Promise<boolean> {
    if (!refreshing) {
        refreshing = callRefresh().finally(() => { refreshing = null; });
    }
    return refreshing;
}

// Fetch wrapper example
export async function secureFetch(url: string, options: RequestInit = {}) {
    let res = await fetch(url, { ...options, credentials: "include" });

    if (res.headers.get("x-token-status") === "stale") {
        // Refresh the token without interrupting the user experience
        await ensureFreshToken();

        // Retry the original request after refreshing
        res = await fetch(url, { ...options, credentials: "include" });
    }

    // If got unauthorized, try one refresh then retry once
    if (res.status === 401 || res.status === 403) {
        const ok = await ensureFreshToken();
        if (ok) {
            res = await fetch(url, { ...options, credentials: "include" });
        }
    }

    return res;
}
