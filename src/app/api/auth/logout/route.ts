import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { clearRefreshTokenCookie } from "@/lib/jwt";
import { verifyAccessToken } from "@/lib/jwt-edge";

export async function POST() {
    const cookieStore = await cookies();

    // Best-effort revocation strategy (token -> user+device -> user):
    const refreshToken = cookieStore.get("refresh_token")?.value;
    const accessToken = cookieStore.get("access_token")?.value;
    const deviceIdHeader = (await headers()).get("x-device-id");

    try {
        if (refreshToken) {
            // Fast path: unique token delete + clear cookies in helper
            await clearRefreshTokenCookie(refreshToken);
        } else {
            // Derive identifiers to target deletion
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
                // Fallback: revoke all sessions for this user on this client
                await prisma.refresh_token.deleteMany({ where: { userId } });
            } else if (deviceId) {
                // Last resort: revoke by device only
                await prisma.refresh_token.deleteMany({ where: { deviceId } });
            }

            // Clear refresh token cookies even if we couldn't read the value (path-scoped)
            cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/api/auth/refresh" });
            cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/" });
        }
    } catch {
        // Swallow errors: logout should still clear client cookies and finish fast
    cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/api/auth/refresh" });
    cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/" });
    }

    // Always clear access token cookie
    cookieStore.set("access_token", "", { expires: new Date(0), path: "/" });

    return new Response(null, { status: 204 });
}
