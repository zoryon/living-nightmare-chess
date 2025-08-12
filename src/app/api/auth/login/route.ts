import bcrypt from "bcrypt";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { refresh_token } from "@/generated/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";
import { detectDeviceType, extractClientIp, getGeolocation } from "@/lib/utils";

export async function POST(req: Request) {
    const { email, password } = await req.json();
    const existingDeviceIdHeader = req.headers.get("x-device-id");

    if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password required" }), { status: 400 });
    }

    // Find the user by unique email and then verify the email verification flag separately
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isEmailVerified) {
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    let deviceId: number | null = existingDeviceIdHeader ? Number(existingDeviceIdHeader) : null;
    if (deviceId && !Number.isInteger(deviceId)) deviceId = null;

    // Create device if not provided or does not exist (first login from this browser)
    if (!deviceId) {
        const userAgent = req.headers.get("user-agent") || "";
        const deviceType = detectDeviceType(userAgent);
        const device = await prisma.device.create({
            data: {
                userId: user.id,
                userAgent,
                deviceType
            },
            select: { id: true }
        });
        deviceId = device.id;
    } else {
        // Update lastSeenAt
        await prisma.device.update({ where: { id: deviceId }, data: { lastSeenAt: new Date() } }).catch(() => {});
    }

    // Check if there is already a valid refresh token for this device
    const refreshTokenRecord: refresh_token | null = deviceId ? await prisma.refresh_token.findFirst({
        where: {
            userId: user.id,
            deviceId,
            expiresAt: { gt: new Date() }
        }
    }) : null;

    if (refreshTokenRecord) {
        // Set the already existing token as cookie (standardized path)
        const cookieStore = await cookies();
        cookieStore.set("refresh_token", refreshTokenRecord.token!, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/auth/refresh",
            expires: refreshTokenRecord.expiresAt!
        });
    } else {
        const ipAddress = extractClientIp(req.headers);
        const geo = getGeolocation(req.headers);

        // Create a new refresh token
        await setRefreshTokenCookie({
            userId: user.id,
            deviceId: deviceId!,
            ipAddress,
            geo
        });
    }
    
    await setAccessTokenCookie(user.id);

    return new Response(JSON.stringify({ deviceId }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
