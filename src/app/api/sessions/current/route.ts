import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { clearRefreshTokenCookie } from "@/lib/jwt";
import { verifyAccessToken } from "@/lib/jwt-edge";

// Get current session (exposes current access token value for WS auth)
export async function GET() {
    const token = (await cookies()).get("access_token");
    if (!token) {
        return new Response("Not found", { status: 404 });
    }
    // Return only the token value, not the full cookie object
    return new Response(JSON.stringify({ token: token.value }), {
        status: 200,
        headers: { "content-type": "application/json" }
    });
}

// Destroy current session (logout)
export async function DELETE() {
    const cookieStore = await cookies();

    const refreshToken = cookieStore.get("refresh_token")?.value;
    const accessToken = cookieStore.get("access_token")?.value;
    const deviceIdHeader = (await headers()).get("x-device-id");

    try {
        if (refreshToken) {
            await clearRefreshTokenCookie(refreshToken);
        } else {
            let userId: number | null = null;
            if (accessToken) {
                const payload: any = await verifyAccessToken(accessToken);
                if (payload && typeof payload.userId === "number") {
                    userId = payload.userId as number;
                }
            }

            const deviceId = deviceIdHeader && /^\d+$/.test(deviceIdHeader) ? Number(deviceIdHeader) : null;

            if (userId && deviceId) {
                await prisma.refresh_token.deleteMany({ where: { userId, deviceId } });
            } else if (userId) {
                await prisma.refresh_token.deleteMany({ where: { userId } });
            } else if (deviceId) {
                await prisma.refresh_token.deleteMany({ where: { deviceId } });
            }

            cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/api/sessions/current/refresh" });
            cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/" });
        }
    } catch {
        cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/api/sessions/current/refresh" });
        cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/" });
    }

    cookieStore.set("access_token", "", { expires: new Date(0), path: "/" });

    return new Response(null, { status: 204 });
}
