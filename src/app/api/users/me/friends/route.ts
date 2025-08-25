import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/server";

export async function GET(): Promise<Response> {
    const userId = await getUserId();
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
