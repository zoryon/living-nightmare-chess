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
export async function authFetch(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
    const res = await fetch(input, init);
    if (res.status !== 401) return res;
    const ok = await ensureFreshToken();
    if (!ok) return res; // still 401
    return fetch(input, init); // retry once
}
