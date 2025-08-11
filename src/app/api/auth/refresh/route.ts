import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie } from "@/lib/jwt";
import { verifyRefreshToken } from "@/lib/jwt-edge";

export async function POST(request: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get("refresh_token")?.value;
    if (!token) {
        return new Response(JSON.stringify({ error: "missing_refresh_token" }), { status: 401 });
    }

    // Verify token signature first
    const payload: any = await verifyRefreshToken(token);
    if (!payload) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token" }), { status: 401 });
    }

    // Determine device id: prefer header, else token payload
    const headerDeviceId = request.headers.get("x-device-id");
    let deviceId: number | null = headerDeviceId ? Number(headerDeviceId) : null;
    if (!deviceId || !Number.isInteger(deviceId)) {
        if (payload.deviceId && Number.isInteger(payload.deviceId)) {
            deviceId = payload.deviceId;
        } else {
            return new Response(JSON.stringify({ error: "missing_device_id" }), { status: 400 });
        }
    }

    // Check if the token exists, for this device, in the database
    const stored = await prisma.refresh_token.findFirst({
        where: {
            token,
            deviceId: deviceId!,
            user: {
                isEmailVerified: { not: null }
            }
        },
        include: {
            user: true
        }
    });
    if (!stored || stored.expiresAt! < new Date()) {
        return new Response(JSON.stringify({ error: "invalid_refresh_token_device" }), { status: 401 });
    }

    // Update device last seen
    await prisma.device.update({ where: { id: deviceId! }, data: { lastSeenAt: new Date() } }).catch(() => {});

    await setAccessTokenCookie(stored.userId as number);

    return new Response(JSON.stringify({ ok: true, deviceId }), { status: 200 });
}
