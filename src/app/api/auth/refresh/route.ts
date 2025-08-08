import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";

export async function POST(request: Request) {
    const deviceId = request.headers.get("x-device-id") || "";
    if (!deviceId) {
        return new Response(JSON.stringify({ error: "missing_device_id" }), { status: 400 });
    }
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    if (!token) {
        return new Response(JSON.stringify({ error: "missing_refresh_token" }), { status: 401 });
    }

    // Verify token signature first
    const payload = verifyRefreshToken(token);
    if (!payload) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token" }), { status: 401 });
    }

    // Ensure token exists in DB for that device
    const stored = await prisma.refresh_token.findFirst({ where: { token, deviceId } });
    if (!stored || !stored.expiresAt || stored.expiresAt < new Date() || stored.userId == null) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token" }), { status: 401 });
    }

    // Rotate refresh token (optional but recommended)
    await setRefreshTokenCookie(stored.userId, deviceId);
    await setAccessTokenCookie(stored.userId);
    return new Response(JSON.stringify({ ok: true, rotated: true }), { status: 200 });
}
