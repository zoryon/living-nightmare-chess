import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";

async function isAuthenticated(req: NextRequest): Promise<boolean> {
    const accessToken = req.cookies.get("access_token")?.value || "";
    const payload = await verifyAccessToken(accessToken);
    return !!payload;
}

// GET /api/queues/match/summary -> { playersNum: number }
export async function GET(req: NextRequest): Promise<Response> {
    const ok = await isAuthenticated(req);
    if (!ok) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

    const playersNum = await prisma.match_queue.count({ where: { status: "WAITING" } });
    return new Response(JSON.stringify({ playersNum }), { status: 200 });
}
