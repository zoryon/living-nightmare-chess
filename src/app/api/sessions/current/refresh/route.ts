import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie } from "@/lib/jwt";
import { verifyRefreshToken } from "@/lib/jwt-edge";

// Refresh current session's access token
export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    if (!token) {
        return new Response(JSON.stringify({ error: "missing_refresh_token" }), { status: 401 });
    }

    const payload: any = await verifyRefreshToken(token);
    if (!payload) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token" }), { status: 401 });
    }

    let deviceId: number | null = (payload.deviceId && Number.isInteger(payload.deviceId)) ? Number(payload.deviceId) : null;
    if (!deviceId) {
        return new Response(JSON.stringify({ error: "missing_device_id" }), { status: 400 });
    }

    const stored = await prisma.refresh_token.findUnique({
        where: { token },
        select: { userId: true, deviceId: true, expiresAt: true },
    });
    if (!stored || stored.expiresAt! < new Date() || Number(stored.deviceId) !== Number(deviceId)) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token_device" }), { status: 401 });
    }

    prisma.device.update({ where: { id: deviceId! }, data: { lastSeenAt: new Date() } }).catch(() => { });

    await setAccessTokenCookie(stored.userId as number);

    return new Response(JSON.stringify({ ok: true, deviceId }), { status: 200 });
}
