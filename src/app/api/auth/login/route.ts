import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";
import { refresh_token } from "../../../../../generated/prisma";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    const { email, password } = await req.json();
    const deviceId = req.headers.get("x-device-id") || "";

    if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password required" }), { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    // Check if there is already a valid refresh token for this device
    const refreshTokenRecord: refresh_token | null = await prisma.refresh_token.findFirst({
        where: {
            userId: user.id,
            deviceId,
            expiresAt: { gt: new Date() }
        }
    });

    if (refreshTokenRecord) {
        // Set the already existing token as cookie
        (await cookies()).set("refresh_token", refreshTokenRecord.token!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            expires: refreshTokenRecord.expiresAt ?? undefined
        });
    } else {
        // Create a new refresh token
        await setRefreshTokenCookie(user.id, deviceId);
    }
    
    await setAccessTokenCookie(user.id);

    return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
