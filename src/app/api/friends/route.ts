import { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyAccessToken } from "@/lib/jwt-edge";

async function getUserId(req: NextRequest): Promise<number | null> {
  const accessToken = req.cookies.get("access_token")?.value || "";
  const payload = await verifyAccessToken(accessToken);
  const uid = payload && typeof payload.userId === "number" ? payload.userId : null;
  return uid;
}

export async function GET(req: NextRequest): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const friends = await prisma.friendship.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      userA: { select: { id: true, username: true } },
      userB: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: "desc" }
  });

  const list = friends.map(f => {
    const friend = f.userAId === userId ? f.userB : f.userA;
    return { id: friend.id, username: friend.username };
  });

  return new Response(JSON.stringify({ friends: list }), { status: 200 });
}

export async function DELETE(req: NextRequest): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  const body = await req.json().catch(() => ({}));
  const otherId = Number(body.userId);
  if (!Number.isInteger(otherId)) return new Response(JSON.stringify({ error: "userId required" }), { status: 400 });

  const a = Math.min(userId, otherId);
  const b = Math.max(userId, otherId);
  await prisma.friendship.deleteMany({ where: { userAId: a, userBId: b } });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
}
