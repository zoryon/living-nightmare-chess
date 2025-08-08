import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { verifyRefreshToken, signAccessToken } from "@/lib/jwt";

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get("refreshToken")?.value;

    if (!token) {
        return new Response(JSON.stringify({ error: "No refresh token" }), { status: 401 });
    }

    const stored = await prisma.refresh_token.findUnique({ where: { token } });
    if (
        !stored ||
        !stored.expiresAt ||
        stored.expiresAt < new Date()
    ) {
        return new Response(JSON.stringify({ error: "Invalid refresh token" }), { status: 401 });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
        return new Response(JSON.stringify({ error: "Invalid refresh token" }), { status: 401 });
    }

    const accessToken = signAccessToken({ userId: payload.userId });
    return new Response(JSON.stringify({ accessToken }), { status: 200 });
}
