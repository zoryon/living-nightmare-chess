import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";
import { detectDeviceType, extractClientIp, getGeolocation } from "@/lib/utils";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: Request) {
    const { email, username, password } = await req.json();
    const existingDeviceIdHeader = req.headers.get("x-device-id");

    if (!username || !password) {
        return new Response(JSON.stringify({ error: "username and password required" }), { status: 400 });
    }

    if (!email || !email.includes("@")) {
        return new Response(JSON.stringify({ error: "Invalid email" }), { status: 400 });
    }

    if (email) {
        const exists = await prisma.user.findUnique({ where: { email } });
        if (exists) return new Response(JSON.stringify({ error: "Email already registered" }), { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
        data: {
            email,
            username,
            passwordHash
        },
        select: { id: true, email: true, username: true, createdAt: true }
    });

    // Create or use existing device
    let deviceId: number | null = existingDeviceIdHeader ? Number(existingDeviceIdHeader) : null;
    if (deviceId && !Number.isInteger(deviceId)) deviceId = null;

    if (!deviceId) {
        const userAgent = req.headers.get("user-agent") || "";
        const deviceType = detectDeviceType(userAgent);
        const device = await prisma.device.create({
            data: { userId: user.id, userAgent, deviceType },
            select: { id: true }
        });
        deviceId = device.id;
    }

    const ipAddress = extractClientIp(req.headers);
    const geo = getGeolocation(req.headers);

    // Automatically log-in (with device id)
    await setRefreshTokenCookie({
        userId: user.id,
        deviceId: deviceId!,
        ipAddress,
        geo
    });
    await setAccessTokenCookie(user.id);

    return new Response(JSON.stringify({ user, deviceId }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}
