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
