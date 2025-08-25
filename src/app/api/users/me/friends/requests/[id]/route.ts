import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server";

// DELETE /api/users/me/friends/requests/:id (cancel own outgoing pending)
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
    const userId = await getUserId();
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const { id } = await ctx.params;
    const requestId = Number(id);
    if (!Number.isInteger(requestId)) return new Response(JSON.stringify({ error: "invalid id" }), { status: 400 });

    await prisma.friend_request.updateMany({
        where: { id: requestId, fromUserId: userId, status: "PENDING" },
        data: { status: "CANCELLED" },
    });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}

// PATCH /api/users/me/friends/requests/:id { status: "ACCEPTED" | "DECLINED" }
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }): Promise<Response> {
    const userId = await getUserId();
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const { id } = await ctx.params;
    const requestId = Number(id);
    if (!Number.isInteger(requestId)) return new Response(JSON.stringify({ error: "invalid id" }), { status: 400 });

    const body = await req.json().catch(() => ({}));
    const status = (body?.status as string) || "";
    if (status !== "ACCEPTED" && status !== "DECLINED") {
        return new Response(JSON.stringify({ error: "status must be ACCEPTED or DECLINED" }), { status: 400 });
    }

    const reqRow = await prisma.friend_request.findFirst({ where: { id: requestId, toUserId: userId, status: "PENDING" } });
    if (!reqRow) return new Response(JSON.stringify({ error: "not_found" }), { status: 404 });

    if (status === "DECLINED") {
        await prisma.friend_request.update({ where: { id: reqRow.id }, data: { status: "DECLINED" } });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    const a = Math.min(reqRow.fromUserId, reqRow.toUserId);
    const b = Math.max(reqRow.fromUserId, reqRow.toUserId);
    await prisma.$transaction([
        prisma.friend_request.update({ where: { id: reqRow.id }, data: { status: "ACCEPTED" } }),
        prisma.friendship.upsert({ where: { userAId_userBId: { userAId: a, userBId: b } }, update: {}, create: { userAId: a, userBId: b } })
    ]);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
