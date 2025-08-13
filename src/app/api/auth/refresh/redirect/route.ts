import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie } from "@/lib/jwt";
import { verifyRefreshToken } from "@/lib/jwt-edge";

// This endpoint enables a safe server-side refresh flow via redirect, so the
// browser sends the path-scoped refresh cookie. It then redirects back.
export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const nextRaw = url.searchParams.get("next") || "/";

        // Prevent open redirects: only allow internal paths
        const nextPath = sanitizeNext(nextRaw);

        const cookieStore = await cookies();
        const token = cookieStore.get("refresh_token")?.value;
        if (!token) {
            return NextResponse.redirect(new URL("/login", url));
        }

        const payload: any = await verifyRefreshToken(token);
        if (!payload || !payload.userId || !payload.deviceId) {
            return NextResponse.redirect(new URL("/login", url));
        }

        // Validate token/device in DB and expiry
        const stored = await prisma.refresh_token.findFirst({
            where: {
                token,
                deviceId: Number(payload.deviceId),
                userId: Number(payload.userId),
                user: { isEmailVerified: { not: null } },
            },
            include: { user: true },
        });

        if (!stored || stored.expiresAt! < new Date()) {
            return NextResponse.redirect(new URL("/login", url));
        }

        // Touch device last seen (soft fail)
        await prisma.device
            .update({ where: { id: Number(payload.deviceId) }, data: { lastSeenAt: new Date() } })
            .catch(() => {});

        await setAccessTokenCookie(Number(payload.userId));

        return NextResponse.redirect(new URL(nextPath, url));
    } catch {
        // On any unexpected error, send user to login
        const url = new URL(request.url);
        return NextResponse.redirect(new URL("/login", url));
    }
}

function sanitizeNext(nextRaw: string): string {
    try {
        // Only allow same-origin relative paths. Disallow protocol-relative and external URLs.
        if (!nextRaw.startsWith("/") || nextRaw.startsWith("//")) return "/";
        // Optionally, prevent navigating back into the refresh area
        if (nextRaw.startsWith("/api/auth/refresh")) return "/";
        return nextRaw;
    } catch {
        return "/";
    }
}
