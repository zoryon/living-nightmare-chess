import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";

async function getUserId(req: NextRequest): Promise<number | null> {
    const accessToken = req.cookies.get("access_token")?.value || "";
    const payload = await verifyAccessToken(accessToken);
    const uid = payload && typeof payload.userId === "number" ? payload.userId : null;
    return uid;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
    const userId = await getUserId(req);
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
    const { id } = await ctx.params;
    const rid = Number(id);
    const body = await req.json().catch(() => ({}));
    const { action } = body as { action?: "accept" | "decline" };
    if (!Number.isInteger(rid) || !action) return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });

    // Find pending request addressed to this user
    const request = await prisma.friend_request.findFirst({
        where: { id: rid, toUserId: userId, status: "PENDING" }
    });
    if (!request) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

    if (action === "decline") {
        await prisma.friend_request.update({ where: { id: rid }, data: { status: "DECLINED" } });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    // Accept -> create friendship (ordered pair) and mark request accepted
    const a = Math.min(request.fromUserId, request.toUserId);
    const b = Math.max(request.fromUserId, request.toUserId);
    await prisma.$transaction([
        prisma.friend_request.update({ where: { id: rid }, data: { status: "ACCEPTED" } }),
        prisma.friendship.upsert({
            where: { userAId_userBId: { userAId: a, userBId: b } },
            update: {},
            create: { userAId: a, userBId: b }
        })
    ]);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
