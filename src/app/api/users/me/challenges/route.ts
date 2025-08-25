import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server";

export async function GET(): Promise<Response> {
  const userId = await getUserId();
  if (!userId) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const outgoing = await prisma.friend_challenge.findMany({
    where: { fromUserId: userId, status: "WAITING" },
    orderBy: { createdAt: "desc" },
  });
  const incoming = await prisma.friend_challenge.findMany({
    where: { toUserId: userId, status: "WAITING" },
    orderBy: { createdAt: "desc" },
  });
  return new Response(JSON.stringify({ outgoing, incoming }), { status: 200 });
}
