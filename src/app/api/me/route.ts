import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt";

export async function GET(req: Request) {
    const auth = req.headers.get("authorization") ?? "";
    const parts = auth.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return new Response(JSON.stringify({ error: "Missing token" }), { status: 401 });
    }
    const token = parts[1];
    const payload = verifyAccessToken(token);
    if (!payload) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401 });

    const userId = (payload as any).userId;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) }, select: { id: true, username: true, email: true, createdAt: true } });
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

    return new Response(JSON.stringify({ user }), { status: 200, headers: { "Content-Type": "application/json" } });
}
