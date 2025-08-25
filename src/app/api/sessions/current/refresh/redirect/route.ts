import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie } from "@/lib/jwt";
import { verifyRefreshToken } from "@/lib/jwt-edge";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const nextRaw = url.searchParams.get("next") || "/";

        // Prevent open redirects: only allow internal paths
        const nextPath = sanitizeNext(nextRaw);

        const cookieStore = await cookies();
        const token = cookieStore.get("refresh_token")?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/landing", url));
        }

        const payload: any = await verifyRefreshToken(token);
        if (!payload || !payload.userId || !payload.deviceId) {
            return NextResponse.redirect(new URL("/landing", url));
        }

        // Validate token in DB by unique token only (fast path), then check fields in code
        const stored = await prisma.refresh_token.findUnique({
            where: { token },
            select: { userId: true, deviceId: true, expiresAt: true },
        });

        if (!stored || stored.expiresAt! < new Date() || Number(stored.deviceId) !== Number(payload.deviceId) || Number(stored.userId) !== Number(payload.userId)) {
            return NextResponse.redirect(new URL("/landing", url));
        }

        // Touch device last seen (soft fail)
        // Fire-and-forget: don't block the response on this update
        prisma.device.update({ where: { id: Number(payload.deviceId) }, data: { lastSeenAt: new Date() } }).catch(() => {});

        await setAccessTokenCookie(Number(payload.userId));

        return NextResponse.redirect(new URL(nextPath, url));
    } catch {
        const url = new URL(request.url);
        return NextResponse.redirect(new URL("/landing", url));
    }
}

function sanitizeNext(nextRaw: string): string {
    try {
        // Only allow same-origin relative paths. Disallow protocol-relative and external URLs.
        if (!nextRaw.startsWith("/") || nextRaw.startsWith("//")) return "/";
        // prevent navigating back into the refresh area
        if (nextRaw.startsWith("/api/sessions/current/refresh")) return "/";
        return nextRaw;
    } catch {
        return "/";
    }
}
