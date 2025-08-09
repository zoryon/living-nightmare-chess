export function getDeviceId(): number | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("device_id");
    if (!raw) return null;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
}

export function setDeviceId(id: number) {
    if (typeof window === "undefined") return;
    if (!Number.isInteger(id) || id <= 0) return;
    localStorage.setItem("device_id", String(id));
}
