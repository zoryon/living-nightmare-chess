import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

export async function POST(req: Request) {
    const { email, username, password, deviceId } = await req.json();

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

    // Automatically log-in
    await setRefreshTokenCookie(user.id, deviceId || "unknown");
    await setAccessTokenCookie(user.id);

    return new Response(JSON.stringify({ user }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
    });
}
