import { getOrCreateDeviceId } from "../device";

let refreshing: Promise<boolean> | null = null;

async function callRefresh(): Promise<boolean> {
    try {
        const deviceId = typeof window !== "undefined" ? localStorage.getItem("device_id") || "" : "";
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            credentials: "include",
            headers: { "x-device-id": deviceId }
        });
        if (!res.ok) return false;
        const data = await res.json();
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
    let res = await fetch(url, options);

    if (res.headers.get("x-token-status") === "stale") {
        // Refresh the token without interrupting the user experience
        await fetch("/api/auth/refresh", { 
            method: "POST",
            credentials: "include",
            headers: { "x-device-id": getOrCreateDeviceId() }
        });

        // Retry the original request after refreshing
        res = await fetch(url, options);
    }

    return res;
}
