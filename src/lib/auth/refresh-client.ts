import { getDeviceId, setDeviceId } from "../device";

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
    let res = await fetch(url, options);

    if (res.headers.get("x-token-status") === "stale") {
        // Refresh the token without interrupting the user experience
        const deviceId = getDeviceId();
        const headers: Record<string, string> = {};
        if (deviceId) headers["x-device-id"] = String(deviceId);
        const refreshRes = await fetch("/api/auth/refresh", { 
            method: "POST",
            credentials: "include",
            headers
        });
        if (refreshRes.ok) {
            const data = await refreshRes.json();
            if (data.deviceId && !deviceId) setDeviceId(Number(data.deviceId));
        }

        // Retry the original request after refreshing
        res = await fetch(url, options);
    }

    return res;
}
