import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";

async function getUserId(req: NextRequest): Promise<number | null> {
    const accessToken = req.cookies.get("access_token")?.value || "";
    const payload = await verifyAccessToken(accessToken);
    return payload && typeof payload.userId === "number" ? payload.userId : null;
}

// GET /api/users/me/friends/requests?direction=incoming|outgoing
export async function GET(req: NextRequest): Promise<Response> {
    const userId = await getUserId(req);
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const { searchParams } = new URL(req.url);
    const direction = searchParams.get("direction");

    if (direction !== "incoming" && direction !== "outgoing") {
        return new Response(JSON.stringify({ error: "direction must be 'incoming' or 'outgoing'" }), { status: 400 });
    }

    if (direction === "incoming") {
        const requests = await prisma.friend_request.findMany({
            where: { toUserId: userId, status: "PENDING" },
            include: { fromUser: { select: { id: true, username: true } } },
            orderBy: { createdAt: "desc" },
        });
        const shaped = requests.map(r => ({ id: r.id, from: r.fromUser }));
        return new Response(JSON.stringify({ requests: shaped }), { status: 200 });
    }

    // outgoing
    const requests = await prisma.friend_request.findMany({
        where: { fromUserId: userId, status: "PENDING" },
        include: { toUser: { select: { id: true, username: true } } },
        orderBy: { createdAt: "desc" },
    });
    const shaped = requests.map(r => ({ id: r.id, to: r.toUser }));
    return new Response(JSON.stringify({ requests: shaped }), { status: 200 });
}

// POST /api/users/me/friends/requests
// body: { username: string }
export async function POST(req: NextRequest): Promise<Response> {
    const userId = await getUserId(req);
    if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { username } = body as { username?: string };
    if (!username) return new Response(JSON.stringify({ error: "username required" }), { status: 400 });

    const to = await prisma.user.findFirst({ where: { username } });
    if (!to) return new Response(JSON.stringify({ error: "user_not_found" }), { status: 404 });
    if (to.id === userId) return new Response(JSON.stringify({ error: "cannot_add_self" }), { status: 400 });

    const a = Math.min(userId, to.id);
    const b = Math.max(userId, to.id);
    const existingFriend = await prisma.friendship.findFirst({ where: { userAId: a, userBId: b } });
    if (existingFriend) return new Response(JSON.stringify({ error: "already_friends" }), { status: 409 });

    const reverse = await prisma.friend_request.findFirst({ where: { fromUserId: to.id, toUserId: userId, status: "PENDING" } });
    if (reverse) {
        await prisma.$transaction([
            prisma.friend_request.update({ where: { id: reverse.id }, data: { status: "ACCEPTED" } }),
            prisma.friendship.upsert({ where: { userAId_userBId: { userAId: a, userBId: b } }, update: {}, create: { userAId: a, userBId: b } })
        ]);
        return new Response(JSON.stringify({ ok: true, autoAccepted: true }), { status: 200 });
    }

    const created = await prisma.friend_request.upsert({
        where: { fromUserId_toUserId: { fromUserId: userId, toUserId: to.id } },
        update: { status: "PENDING", updatedAt: new Date() },
        create: { fromUserId: userId, toUserId: to.id }
    });
    // Race-safe: if a reverse pending showed up in the meantime, auto-accept both and create friendship
    const reverseAfter = await prisma.friend_request.findFirst({ where: { fromUserId: to.id, toUserId: userId, status: "PENDING" } });
    if (reverseAfter) {
        await prisma.$transaction([
            prisma.friend_request.update({ where: { id: reverseAfter.id }, data: { status: "ACCEPTED" } }),
            prisma.friend_request.updateMany({ where: { fromUserId: userId, toUserId: to.id, status: "PENDING" }, data: { status: "ACCEPTED" } }),
            prisma.friendship.upsert({ where: { userAId_userBId: { userAId: a, userBId: b } }, update: {}, create: { userAId: a, userBId: b } })
        ]);
        return new Response(JSON.stringify({ ok: true, autoAccepted: true }), { status: 200 });
    }
    return new Response(JSON.stringify({ ok: true, requestId: created.id }), { status: 200 });
}
