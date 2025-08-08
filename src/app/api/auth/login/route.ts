import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/lib/jwt";

export async function POST(req: Request) {
    const { email, password, deviceId } = await req.json();

    if (!email || !password) {
        return new Response(JSON.stringify({ error: "email and password required" }), { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    await setRefreshTokenCookie(user.id, deviceId);
    await setAccessTokenCookie(user.id);

    return new Response(JSON.stringify({ user }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
    });
}
