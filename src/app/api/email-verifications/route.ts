import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";
import { extractClientIp, getGeolocation } from "@/lib/utils";
import { verifyEmailToken } from "@/lib/jwt-edge";

// Verify user's email using a confirmation token
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => ({} as any));
    const token: string | undefined = body?.token;
    if (!token) {
        return new Response(JSON.stringify({ error: "Token is required" }), { status: 400 });
    }

    const payload = await verifyEmailToken(token);
    if (!payload || typeof payload.userId !== "number" || typeof payload.deviceId !== "number") {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), { status: 400 });
    }

    // Mark user as verified (idempotent: always set true)
    await prisma.user.update({ where: { id: payload.userId }, data: { isEmailVerified: true } });

    const ipAddress = extractClientIp(req.headers);
    const geo = getGeolocation(req.headers);

    // Auto-login on this device by issuing refresh/access tokens
    await setRefreshTokenCookie({ userId: payload.userId, deviceId: payload.deviceId, ipAddress, geo });
    await setAccessTokenCookie(payload.userId);

    return new Response(JSON.stringify({ success: true }), { status: 200 });
}
