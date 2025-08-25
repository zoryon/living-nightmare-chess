import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";

async function getUserId(req: NextRequest): Promise<number | null> {
    const accessToken = req.cookies.get("access_token")?.value || "";
    const payload = await verifyAccessToken(accessToken);
    return payload && typeof payload.userId === "number" ? payload.userId : null;
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ friendId: string }> }): Promise<Response> {
    const userId = await getUserId(req);
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const { friendId } = await ctx.params;
    const otherId = Number(friendId);
    if (!Number.isInteger(otherId)) return new Response(JSON.stringify({ error: "friendId must be an integer" }), { status: 400 });

    const a = Math.min(userId, otherId);
    const b = Math.max(userId, otherId);
    await prisma.friendship.deleteMany({ where: { userAId: a, userBId: b } });

    return new Response(null, { status: 204 });
}
