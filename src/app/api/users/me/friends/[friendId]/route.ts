import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server";

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ friendId: string }> }): Promise<Response> {
    const userId = await getUserId();
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const { friendId } = await ctx.params;
    const otherId = Number(friendId);
    if (!Number.isInteger(otherId)) return new Response(JSON.stringify({ error: "friendId must be an integer" }), { status: 400 });

    const a = Math.min(userId, otherId);
    const b = Math.max(userId, otherId);
    await prisma.friendship.deleteMany({ where: { userAId: a, userBId: b } });

    return new Response(null, { status: 204 });
}
