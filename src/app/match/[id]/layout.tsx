import { cookies } from "next/headers";

import { verifyAccessToken } from "@/lib/jwt-edge";
import { prisma } from "@/lib/prisma";

export default async function MatchLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: strId } = await params;

    let id: number;
    try {
        id = Number(strId);
    } catch (error) {
        console.error("Error: " + error);
        return <div>Match not found</div>;
    }

    // Get current access token
    const accessToken = (await cookies()).get("access_token")?.value || "";

    // Verify token
    const payload = await verifyAccessToken(accessToken);
    if (!payload || typeof payload.userId !== "number") {
        return <div>Match not found</div>;
    }

    const userId = payload.userId;

    // Cross check match in the DB
    const match = await prisma.match.findUnique({
        where: {
            id,
            match_player: {
                some: {
                    user: {
                        id: userId,
                    },
                },
            },
        },
        include: { match_player: true },
    });

    if (!match) {
        return <div>Match not found</div>;
    }

    return match.status === "ONGOING" ? (
        <div>
            {children}
        </div>
    ) : (
        <div>Match has finished, {match.winnerId} won the match</div>
    );
}
