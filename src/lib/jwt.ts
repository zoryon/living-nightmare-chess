import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const EMAIL_SECRET = process.env.JWT_EMAIL_SECRET!;
const ACCESS_EXPIRES_IN = Number(process.env.ACCESS_TOKEN_EXPIRES_IN ?? 900); // 15 min
const REFRESH_EXPIRES_IN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_IN_DAYS ?? 30); // 30 days
const EMAIL_EXPIRES_IN = Number(process.env.EMAIL_TOKEN_EXPIRES_IN ?? 1800); // 30 min

if (!ACCESS_SECRET || !REFRESH_SECRET || !EMAIL_SECRET) {
    throw new Error("Missing JWT secrets in env");
}

export function signAccessToken(payload: object) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: `${ACCESS_EXPIRES_IN}s` });
}

export function signRefreshToken(payload: object) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRES_IN_DAYS}d` });
}

export function signEmailToken(payload: object) {
    return jwt.sign(payload, EMAIL_SECRET, { expiresIn: `${EMAIL_EXPIRES_IN}s` });
}

export async function setRefreshTokenCookie({ 
    userId, 
    deviceId, 
    ipAddress, 
    geo 
}: {
    userId: number, 
    deviceId: number, 
    ipAddress?: string | null, 
    geo?: { country: string | undefined, region: string | null }
}) {
    const token = signRefreshToken({ userId, deviceId });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_IN_DAYS);

    // Remove old token for the same device
    await prisma.refresh_token.deleteMany({
        where: { userId, deviceId }
    });

    // Store in DB
    await prisma.refresh_token.create({
        data: {
            token,
            deviceId,
            userId,
            expiresAt,
            ipAddress: ipAddress || null,
            country: geo?.country || null,
            region: geo?.region || null,
        }
    });

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("refresh_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/sessions/current/refresh",
        expires: expiresAt
    });

    return token;
}

export async function setAccessTokenCookie(userId: number) {
    const token = signAccessToken({ userId });

    // Set cookie
    (await cookies()).set("access_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: ACCESS_EXPIRES_IN
    });

    return token;
}

export async function clearRefreshTokenCookie(token: string) {
    await prisma.refresh_token.deleteMany({ where: { token } });
    const cookieStore = await cookies();
    cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/api/sessions/current/refresh" });
    cookieStore.set("refresh_token", "", { expires: new Date(0), path: "/" });
}
